import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { examService } from "../../../services/examService"

const ExamsResults = () => {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [results, setResults] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("results")
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
  })

  useEffect(() => {
    loadExamData()
    loadResults()
    loadStatistics()
  }, [id, filters])

  const loadExamData = async () => {
    try {
      const examData = await examService.getExamById(id)
      setExam(examData)
    } catch (err) {
      setError("Error al cargar el examen")
      console.error(err)
    }
  }

  const loadResults = async () => {
    try {
      setLoading(true)
      const data = await examService.getExamResults(id, filters)
      setResults(data.results || [])
      setPagination({
        total: data.total || 0,
        pages: data.pages || 0,
        currentPage: data.currentPage || 1,
      })
    } catch (err) {
      setError("Error al cargar los resultados")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await examService.getExamStatistics(id)
      setStatistics(stats)
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    }
  }

  const handleExport = async (format) => {
    try {
      const blob = await examService.exportExamResults(id, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `resultados-examen-${exam?.title || id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError("Error al exportar los resultados")
      console.error(err)
    }
  }

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", text: "Completado" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", text: "En Progreso" },
      abandoned: { color: "bg-red-100 text-red-800", text: "Abandonado" },
    }

    const config = statusConfig[status] || statusConfig.completed
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>{config.text}</span>
  }

  const getScoreBadge = (score, passingScore) => {
    const passed = score >= passingScore
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {score}% {passed ? "✓" : "✗"}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading && !results.length) {
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
          <div className="flex items-center space-x-2">
            <Link to="/admin/exams" className="text-blue-600 hover:text-blue-800">
              ← Volver a Exámenes
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Resultados: {exam?.title}</h1>
          <p className="text-gray-600">Análisis detallado de resultados y estadísticas</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport("csv")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {/* Información del Examen */}
      {exam && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Materia</p>
              <p className="font-medium">{exam.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duración</p>
              <p className="font-medium">{exam.duration} minutos</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Puntaje Mínimo</p>
              <p className="font-medium">{exam.passingScore}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Preguntas</p>
              <p className="font-medium">{exam.questionCount || exam.questions?.length || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("results")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "results"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Resultados ({pagination.total})
          </button>
          <button
            onClick={() => setActiveTab("statistics")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "statistics"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Estadísticas
          </button>
        </nav>
      </div>

      {/* Contenido de Tabs */}
      {activeTab === "results" && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="completed">Completado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="abandoned">Abandonado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Por página</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number.parseInt(e.target.value), page: 1 }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay resultados disponibles</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estudiante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntaje
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiempo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Intento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{result.student?.name || "N/A"}</div>
                              <div className="text-sm text-gray-500">{result.student?.email || "N/A"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {result.status === "completed" ? (
                              getScoreBadge(result.score, exam?.passingScore || 70)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(result.status)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {result.timeSpent ? formatDuration(result.timeSpent) : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{result.attemptNumber || 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(result.startedAt)}</td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <Link
                              to={`/admin/exams/${id}/results/${result.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Detalle
                            </Link>
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
        </div>
      )}

      {/* Tab de Estadísticas */}
      {activeTab === "statistics" && statistics && (
        <div className="space-y-6">
          {/* Métricas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalAttempts || 0}</div>
              <div className="text-sm text-gray-600">Total Intentos</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600">{statistics.completedAttempts || 0}</div>
              <div className="text-sm text-gray-600">Completados</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.averageScore ? `${statistics.averageScore.toFixed(1)}%` : "0%"}
              </div>
              <div className="text-sm text-gray-600">Promedio</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.passRate ? `${statistics.passRate.toFixed(1)}%` : "0%"}
              </div>
              <div className="text-sm text-gray-600">Tasa Aprobación</div>
            </div>
          </div>

          {/* Distribución de Puntajes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Puntajes</h3>
            <div className="space-y-3">
              {statistics.scoreDistribution &&
                Object.entries(statistics.scoreDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{range}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{
                            width: `${(count / (statistics.totalAttempts || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-900 text-right">{count}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Preguntas Más Difíciles */}
          {statistics.difficultQuestions && statistics.difficultQuestions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preguntas Más Difíciles</h3>
              <div className="space-y-3">
                {statistics.difficultQuestions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {index + 1}. {question.question}
                      </p>
                      <p className="text-xs text-gray-500">Dificultad: {question.difficulty}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {question.correctRate ? `${question.correctRate.toFixed(1)}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-500">Aciertos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiempo Promedio */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis de Tiempo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.averageTime ? formatDuration(statistics.averageTime) : "0:00"}
                </div>
                <div className="text-sm text-gray-600">Tiempo Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.minTime ? formatDuration(statistics.minTime) : "0:00"}
                </div>
                <div className="text-sm text-gray-600">Tiempo Mínimo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statistics.maxTime ? formatDuration(statistics.maxTime) : "0:00"}
                </div>
                <div className="text-sm text-gray-600">Tiempo Máximo</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamsResults