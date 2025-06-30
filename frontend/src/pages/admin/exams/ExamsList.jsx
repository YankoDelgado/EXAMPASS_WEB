import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { examService } from "../../../services/examService"
import { questionService } from "../../../services/questionService"

const ExamsList = () => {
    const navigate = useNavigate()
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [subjects, setSubjects] = useState([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [examToDelete, setExamToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const [filters, setFilters] = useState({
        search: "",
        status: "",
        subject: "",
        page: 1,
        limit: 10,
    })

    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0,
        currentPage: 1,
    })

    useEffect(() => {
        loadExams()
        loadSubjects()
    }, [filters])

    const loadExams = async () => {
        try {
            setLoading(true)
            const data = await examService.getAllExams(filters)
            setExams(data.exams || [])
            setPagination({
                total: data.total || 0,
                pages: data.pages || 0,
                currentPage: data.currentPage || 1,
            })
        } catch (err) {
            setError("Error al cargar los exámenes")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const loadSubjects = async () => {
        try {
            const data = await questionService.getSubjects()
            setSubjects(data.subjects || [])
        } catch (err) {
            console.error("Error cargando materias:", err)
        }
    }

    const handleSearch = (e) => {
        setFilters((prev) => ({
            ...prev,
            search: e.target.value,
            page: 1,
        }))
    }

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: 1,
        }))
    }

    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }))
    }

    const handleToggleStatus = async (examId) => {
        try {
            await examService.toggleExamStatus(examId)
            loadExams()
        } catch (err) {
            setError("Error al cambiar el estado del examen")
            console.error(err)
        }
    }

    const handleDuplicate = async (examId) => {
        try {
            await examService.duplicateExam(examId)
            loadExams()
        } catch (err) {
            setError("Error al duplicar el examen")
            console.error(err)
        }
    }

    const handleDeleteClick = (exam) => {
        setExamToDelete(exam)
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!examToDelete) return

        try {
            setDeleting(true)
            await examService.deleteExam(examToDelete.id)
            setShowDeleteModal(false)
            setExamToDelete(null)
            loadExams()
        } catch (err) {
            setError("Error al eliminar el examen")
            console.error(err)
        } finally {
            setDeleting(false)
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
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>{config.text}</span>
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    if (loading && exams.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Exámenes</h1>
            <p className="text-gray-600">Administra todos los exámenes del sistema</p>
            </div>
            <Link
            to="/admin/exams/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
            Crear Examen
            </Link>
        </div>

        {/* Error Alert */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <input
                type="text"
                placeholder="Título del examen..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="draft">Borrador</option>
                <option value="inactive">Inactivo</option>
                <option value="archived">Archivado</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Materia</label>
                <select
                value={filters.subject}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <option value="">Todas las materias</option>
                {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                    {subject}
                    </option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Por página</label>
                <select
                value={filters.limit}
                onChange={(e) => handleFilterChange("limit", Number.parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                </select>
            </div>
            </div>
        </div>

        {/* Tabla de Exámenes */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {exams.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron exámenes</p>
                <Link to="/admin/exams/create" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                Crear el primer examen
                </Link>
            </div>
            ) : (
            <>
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Examen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Materia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preguntas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {exams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div>
                            <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                            {exam.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{exam.description}</div>
                            )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{exam.subject}</td>
                        <td className="px-6 py-4">{getStatusBadge(exam.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                            {exam.questionCount || exam.questions?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{exam.duration} min</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(exam.createdAt)}</td>
                        <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex space-x-2">
                            <Link
                                to={`/admin/exams/${exam.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalles"
                            >
                                Ver
                            </Link>
                            <Link
                                to={`/admin/exams/${exam.id}/results`}
                                className="text-green-600 hover:text-green-900"
                                title="Ver resultados"
                            >
                                Resultados
                            </Link>
                            <button
                                onClick={() => handleToggleStatus(exam.id)}
                                className={`${
                                exam.status === "active"
                                    ? "text-yellow-600 hover:text-yellow-900"
                                    : "text-green-600 hover:text-green-900"
                                }`}
                                title={exam.status === "active" ? "Desactivar" : "Activar"}
                            >
                                {exam.status === "active" ? "Desactivar" : "Activar"}
                            </button>
                            <button
                                onClick={() => handleDuplicate(exam.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Duplicar"
                            >
                                Duplicar
                            </button>
                            <button
                                onClick={() => handleDeleteClick(exam)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                            >
                                Eliminar
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                {/* Paginación */}
                {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                        Anterior
                        </button>
                        <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.pages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                        Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                        <p className="text-sm text-gray-700">
                            Mostrando{" "}
                            <span className="font-medium">{(pagination.currentPage - 1) * filters.limit + 1}</span> a{" "}
                            <span className="font-medium">
                            {Math.min(pagination.currentPage * filters.limit, pagination.total)}
                            </span>{" "}
                            de <span className="font-medium">{pagination.total}</span> resultados
                        </p>
                        </div>
                        <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                            Anterior
                            </button>
                            {[...Array(pagination.pages)].map((_, index) => {
                            const page = index + 1
                            return (
                                <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === pagination.currentPage
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                                >
                                {page}
                                </button>
                            )
                            })}
                            <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.pages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                            Siguiente
                            </button>
                        </nav>
                        </div>
                    </div>
                    </div>
                </div>
                )}
            </>
            )}
        </div>

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">Confirmar Eliminación</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                    ¿Estás seguro de que deseas eliminar el examen "{examToDelete?.title}"? Esta acción no se puede
                    deshacer.
                    </p>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                    <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    disabled={deleting}
                    >
                    Cancelar
                    </button>
                    <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={deleting}
                    >
                    {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    )
}

export default ExamsList
