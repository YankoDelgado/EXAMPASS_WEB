import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { examService } from "../../../services/examService"

const ExamsView = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [exam, setExam] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useState("details")

    useEffect(() => {loadExam()}, [id])

    const loadExam = async () => {
        try {
            setLoading(true)
            const data = await examService.getExamById(id)
            setExam(data)
        } catch (err) {
            setError("Error al cargar el examen")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        try {
            await examService.toggleExamStatus(id)
            loadExam()
        } catch (err) {
            setError("Error al cambiar el estado del examen")
            console.error(err)
        }
    }

    const handleDuplicate = async () => {
        try {
            await examService.duplicateExam(id)
            navigate("/admin/exams")
        } catch (err) {
            setError("Error al duplicar el examen")
            console.error(err)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { color: "bg-green-100 text-green-800", text: "Activo" },
            draft: { color: "bg-yellow-100 text-yellow-800", text: "Borrador" },
            inactive: { color: "bg-gray-100 text-gray-800", text: "Inactivo" },
            archived: { color: "bg-red-100 text-red-800", text: "Archivado" },
        }

        const config = statusConfig[status] || statusConfig.draft
        return <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>{config.text}</span>
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!exam) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Examen no encontrado</p>
                <Link to="/admin/exams" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                Volver a la lista
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <div className="flex items-center space-x-2 mb-2">
                <Link to="/admin/exams" className="text-blue-600 hover:text-blue-800">
                ← Volver a Exámenes
                </Link>
            </div>
            <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                {getStatusBadge(exam.status)}
            </div>
            <p className="text-gray-600 mt-1">{exam.description}</p>
            </div>
            <div className="flex space-x-2">
            <Link
                to={`/admin/exams/${id}/results`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
                Ver Resultados
            </Link>
            <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg transition-colors ${
                exam.status === "active"
                    ? "bg-yellow-600 text-white hover:bg-yellow-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
            >
                {exam.status === "active" ? "Desactivar" : "Activar"}
            </button>
            <button
                onClick={handleDuplicate}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
                Duplicar
            </button>
            </div>
        </div>

        {/* Error Alert */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Tabs */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
            <button
                onClick={() => setActiveTab("details")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
                Detalles
            </button>
            <button
                onClick={() => setActiveTab("questions")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "questions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
                Preguntas ({exam.questions?.length || exam.questionCount || 0})
            </button>
            <button
                onClick={() => setActiveTab("settings")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
                Configuración
            </button>
            </nav>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información General */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
                <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-gray-500">Materia</label>
                    <p className="text-gray-900">{exam.subject}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Duración</label>
                    <p className="text-gray-900">{exam.duration} minutos</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Puntaje Mínimo</label>
                    <p className="text-gray-900">{exam.passingScore}%</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Intentos Máximos</label>
                    <p className="text-gray-900">{exam.maxAttempts}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Creado</label>
                    <p className="text-gray-900">{formatDate(exam.createdAt)}</p>
                </div>
                {exam.updatedAt && (
                    <div>
                    <label className="text-sm font-medium text-gray-500">Última Modificación</label>
                    <p className="text-gray-900">{formatDate(exam.updatedAt)}</p>
                    </div>
                )}
                </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instrucciones</h3>
                {exam.instructions ? (
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{exam.instructions}</p>
                </div>
                ) : (
                <p className="text-gray-500 italic">No hay instrucciones específicas</p>
                )}
            </div>
            </div>
        )}

        {activeTab === "questions" && (
            <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Preguntas del Examen</h3>
                <span className="text-sm text-gray-500">
                    {exam.questions?.length || exam.questionCount || 0} preguntas
                </span>
                </div>

                {exam.questions && exam.questions.length > 0 ? (
                <div className="space-y-4">
                    {exam.questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                            {index + 1}. {question.question}
                        </h4>
                        <div className="flex space-x-2">
                            <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                question.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : question.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                            >
                            {question.difficulty}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {question.type}
                            </span>
                        </div>
                        </div>

                        {question.type === "multiple_choice" && question.options && (
                        <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2">Opciones:</p>
                            <div className="space-y-1">
                            {question.options.map((option, optionIndex) => (
                                <div
                                key={optionIndex}
                                className={`text-sm p-2 rounded ${
                                    option.isCorrect ? "bg-green-50 text-green-800" : "bg-gray-50 text-gray-700"
                                }`}
                                >
                                {String.fromCharCode(65 + optionIndex)}. {option.text}
                                {option.isCorrect && <span className="ml-2 text-green-600">✓</span>}
                                </div>
                            ))}
                            </div>
                        </div>
                        )}

                        {question.type === "true_false" && (
                        <div className="mt-3">
                            <p className="text-sm text-gray-600">
                            Respuesta correcta:{" "}
                            <span className="font-medium">{question.correctAnswer ? "Verdadero" : "Falso"}</span>
                            </p>
                        </div>
                        )}

                        {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                            <strong>Explicación:</strong> {question.explanation}
                            </p>
                        </div>
                        )}
                    </div>
                    ))}
                </div>
                ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500">
                    {exam.questionSelectionType === "automatic"
                        ? `Este examen selecciona automáticamente ${exam.questionCount} preguntas`
                        : "No hay preguntas configuradas para este examen"}
                    </p>
                </div>
                )}
            </div>
            </div>
        )}

        {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración de Preguntas */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Preguntas</h3>
                <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Selección</label>
                    <p className="text-gray-900">
                    {exam.questionSelectionType === "manual" ? "Selección Manual" : "Selección Automática"}
                    </p>
                </div>
                {exam.questionSelectionType === "automatic" && (
                    <>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Número de Preguntas</label>
                        <p className="text-gray-900">{exam.questionCount}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Distribución de Dificultad</label>
                        <div className="mt-1 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Fácil:</span>
                            <span>{exam.difficultyDistribution?.easy || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Medio:</span>
                            <span>{exam.difficultyDistribution?.medium || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Difícil:</span>
                            <span>{exam.difficultyDistribution?.hard || 0}%</span>
                        </div>
                        </div>
                    </div>
                    </>
                )}
                </div>
            </div>

            {/* Opciones Avanzadas */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones Avanzadas</h3>
                <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Aleatorizar preguntas</span>
                    <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exam.randomizeQuestions ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                    >
                    {exam.randomizeQuestions ? "Sí" : "No"}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Mostrar resultados inmediatamente</span>
                    <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exam.showResultsImmediately ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                    >
                    {exam.showResultsImmediately ? "Sí" : "No"}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Permitir revisar respuestas</span>
                    <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exam.allowReview ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                    >
                    {exam.allowReview ? "Sí" : "No"}
                    </span>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    )
}

export default ExamsView
