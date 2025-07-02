// Componente ExamsCreate.jsx simplificado y estilizado
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

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "",
        duration: 60,
        status: "draft"
    })

    useEffect(() => { loadSubjects() }, [])

    useEffect(() => {
        if (formData.subject) loadQuestionsBySubject()
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

        if (selectedQuestions.length === 0) {
        setError("Debes seleccionar al menos una pregunta")
        return
        }

        try {
        setLoading(true)
        setError("")

        const examData = {
            ...formData,
            questions: selectedQuestions,
            questionIds: selectedQuestions.map((q) => q.id)
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
        if (exists) return prev.filter((q) => q.id !== question.id)
        else if (prev.length < 5) return [...prev, question]
        else return prev
        })
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Examen</h1>
            <p className="text-gray-600">Configura un nuevo examen para los estudiantes</p>
            </div>
            <button
            type="button"
            onClick={() => navigate("/admin/exams")}
            className="text-gray-600 hover:text-gray-900"
            >Volver a Lista</button>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Examen</h2>
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
                    <option key={subject} value={subject}>{subject}</option>
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
                <input
                type="number"
                min="1"
                max="300"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))}
                disabled={formData.duration === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-2">
                <label className="flex items-center">
                    <input
                    type="checkbox"
                    checked={formData.duration === 0}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.checked ? 0 : 60 }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sin límite de tiempo</span>
                </label>
                </div>
            </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Preguntas</h2>
            {availableQuestions.length > 0 ? (
            <div className="space-y-2">
                {availableQuestions.map((question) => (
                <label
                    key={question.id}
                    className={`flex items-start space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${selectedQuestions.some((q) => q.id === question.id) ? 'bg-blue-50' : ''}`}
                >
                    <input
                    type="checkbox"
                    checked={selectedQuestions.some((q) => q.id === question.id)}
                    onChange={() => handleQuestionToggle(question)}
                    disabled={!selectedQuestions.some((q) => q.id === question.id) && selectedQuestions.length >= 5}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{question.question}</p>
                    <p className="text-xs text-gray-500">Dificultad: {question.difficulty} | Tipo: {question.type}</p>
                    </div>
                </label>
                ))}
            </div>
            ) : (
            <p className="text-gray-500 text-center py-4">No hay preguntas disponibles para esta materia</p>
            )}
            <p className="mt-2 text-sm text-gray-600">{selectedQuestions.length} / 5 preguntas seleccionadas</p>
        </div>

        <div className="flex justify-end space-x-4">
            <button
            type="button"
            onClick={() => navigate("/admin/exams")}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >Cancelar</button>
            <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >{loading ? "Creando..." : "Crear Examen"}</button>
        </div>
        </form>
    )
}

export default ExamsCreate