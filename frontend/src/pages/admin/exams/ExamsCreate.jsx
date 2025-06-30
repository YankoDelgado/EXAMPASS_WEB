import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { examService } from "../../../services/examService"
import { questionService } from "../../../services/questionService"

const ExamsCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [subjects, setSubjects] = useState([])
    const [selectedQuestions, setSelectedQuestions] = useState([])
    const [availableQuestions, setAvailableQuestions] = useState([])
    const [showQuestionSelector, setShowQuestionSelector] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "",
        duration: 60,
        passingScore: 70,
        maxAttempts: 1,
        status: "draft",
        instructions: "",
        randomizeQuestions: false,
        showResultsImmediately: true,
        allowReview: false,
        questionSelectionType: "manual",
        questionCount: 10,
        difficultyDistribution: {
        easy: 30,
        medium: 50,
        hard: 20,
        },
    })

    useEffect(() => {loadSubjects()}, [])

    useEffect(() => {
        if (formData.subject) {
            loadQuestionsBySubject()
        }
    }, [formData.subject])

    const loadSubjects = async () => {
        try {
            const data = await questionService.getSubjects()
            setSubjects(data.subjects || [])
        } catch (err) {
            console.error("Error cargando materias:", err)
        }
    }

    const loadQuestionsBySubject = async () => {
        try {
            const data = await questionService.getQuestions({ subject: formData.subject })
            setAvailableQuestions(data.questions || [])
        } catch (err) {
            console.error("Error cargando preguntas:", err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            setError("El título es requerido")
            return
        }

        if (!formData.subject) {
            setError("La materia es requerida")
            return
        }

        if (formData.questionSelectionType === "manual" && selectedQuestions.length === 0) {
            setError("Debes seleccionar al menos una pregunta")
            return
        }

        try {
            setLoading(true)
            setError("")

            const examData = {
                ...formData,
                questions: formData.questionSelectionType === "manual" ? selectedQuestions : [],
                questionIds: formData.questionSelectionType === "manual" ? selectedQuestions.map((q) => q.id) : [],
            }

            await examService.createExam(examData)
            navigate("/admin/exams")
        } catch (err) {
            setError("Error al crear el examen")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleQuestionToggle = (question) => {
        setSelectedQuestions((prev) => {
            const exists = prev.find((q) => q.id === question.id)
            if (exists) {
                return prev.filter((q) => q.id !== question.id)
            } else {
                return [...prev, question]
            }
        })
    }

    const handleDifficultyChange = (difficulty, value) => {
        const newDistribution = {
            ...formData.difficultyDistribution,
            [difficulty]: Number.parseInt(value),
        }

        const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0)
        if (total <= 100) {
            setFormData((prev) => ({
                ...prev,
                difficultyDistribution: newDistribution,
            }))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Examen</h1>
            <p className="text-gray-600">Configura un nuevo examen para los estudiantes</p>
            </div>
            <button type="button" onClick={() => navigate("/admin/exams")} className="text-gray-600 hover:text-gray-900">
            Cancelar
            </button>
        </div>

        {/* Error Alert */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Información Básica */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Título del Examen *</label>
                <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Materia *</label>
                <select
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                >
                <option value="">Seleccionar materia</option>
                {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                    {subject}
                    </option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                </select>
            </div>
            </div>
        </div>

        {/* Configuración del Examen */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Configuración del Examen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
                <input
                type="number"
                min="1"
                max="300"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puntaje Mínimo (%)</label>
                <input
                type="number"
                min="0"
                max="100"
                value={formData.passingScore}
                onChange={(e) => setFormData((prev) => ({ ...prev, passingScore: Number.parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intentos Máximos</label>
                <input
                type="number"
                min="1"
                max="10"
                value={formData.maxAttempts}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxAttempts: Number.parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            </div>

            <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Instrucciones del Examen</label>
            <textarea
                value={formData.instructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Instrucciones específicas para este examen..."
            />
            </div>
        </div>

        {/* Opciones Avanzadas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Opciones Avanzadas</h2>
            <div className="space-y-4">
            <label className="flex items-center">
                <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={(e) => setFormData((prev) => ({ ...prev, randomizeQuestions: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Aleatorizar orden de preguntas</span>
            </label>

            <label className="flex items-center">
                <input
                type="checkbox"
                checked={formData.showResultsImmediately}
                onChange={(e) => setFormData((prev) => ({ ...prev, showResultsImmediately: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mostrar resultados inmediatamente</span>
            </label>

            <label className="flex items-center">
                <input
                type="checkbox"
                checked={formData.allowReview}
                onChange={(e) => setFormData((prev) => ({ ...prev, allowReview: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Permitir revisar respuestas</span>
            </label>
            </div>
        </div>

        {/* Selección de Preguntas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Selección de Preguntas</h2>

            <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Selección</label>
            <div className="flex space-x-4">
                <label className="flex items-center">
                <input
                    type="radio"
                    value="manual"
                    checked={formData.questionSelectionType === "manual"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, questionSelectionType: e.target.value }))}
                    className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Selección Manual</span>
                </label>
                <label className="flex items-center">
                <input
                    type="radio"
                    value="automatic"
                    checked={formData.questionSelectionType === "automatic"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, questionSelectionType: e.target.value }))}
                    className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Selección Automática</span>
                </label>
            </div>
            </div>

            {formData.questionSelectionType === "automatic" && (
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Preguntas</label>
                <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.questionCount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, questionCount: Number.parseInt(e.target.value) }))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distribución de Dificultad (%)</label>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                    <label className="block text-xs text-gray-600 mb-1">Fácil</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.difficultyDistribution.easy}
                        onChange={(e) => handleDifficultyChange("easy", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                    <div>
                    <label className="block text-xs text-gray-600 mb-1">Medio</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.difficultyDistribution.medium}
                        onChange={(e) => handleDifficultyChange("medium", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                    <div>
                    <label className="block text-xs text-gray-600 mb-1">Difícil</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.difficultyDistribution.hard}
                        onChange={(e) => handleDifficultyChange("hard", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Total: {Object.values(formData.difficultyDistribution).reduce((sum, val) => sum + val, 0)}%
                </p>
                </div>
            </div>
            )}

            {formData.questionSelectionType === "manual" && formData.subject && (
            <div>
                <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                    {selectedQuestions.length} pregunta{selectedQuestions.length !== 1 ? "s" : ""} seleccionada
                    {selectedQuestions.length !== 1 ? "s" : ""}
                </p>
                <button
                    type="button"
                    onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                >
                    {showQuestionSelector ? "Ocultar" : "Seleccionar"} Preguntas
                </button>
                </div>

                {showQuestionSelector && (
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {availableQuestions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hay preguntas disponibles para esta materia</p>
                    ) : (
                    <div className="space-y-2">
                        {availableQuestions.map((question) => (
                        <label key={question.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                            <input
                            type="checkbox"
                            checked={selectedQuestions.some((q) => q.id === question.id)}
                            onChange={() => handleQuestionToggle(question)}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{question.question}</p>
                            <p className="text-xs text-gray-500">
                                Dificultad: {question.difficulty} | Tipo: {question.type}
                            </p>
                            </div>
                        </label>
                        ))}
                    </div>
                    )}
                </div>
                )}
            </div>
            )}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
            <button
            type="button"
            onClick={() => navigate("/admin/exams")}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
            Cancelar
            </button>
            <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
            {loading ? "Creando..." : "Crear Examen"}
            </button>
        </div>
        </form>
    )
}

export default ExamsCreate
