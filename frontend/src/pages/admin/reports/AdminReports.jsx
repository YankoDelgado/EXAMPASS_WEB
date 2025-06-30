import { useState, useEffect } from "react"
import {Container,Card,Table,Button,Form,Row,Col,Badge,Spinner,Alert,InputGroup,Pagination,Modal,ProgressBar,} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { adminService } from "../../../services/adminService"

const AdminReports = () => {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Filtros y búsqueda
    const [filters, setFilters] = useState({
        search: "",
        studentId: "",
        dateFrom: "",
        dateTo: "",
        minScore: "",
        maxScore: "",
        examTitle: "",
        page: 1,
        limit: 15,
    })

    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0,
        currentPage: 1,
    })

    // Estadísticas generales
    const [stats, setStats] = useState({
        totalReports: 0,
        averageScore: 0,
        studentsEvaluated: 0,
        reportsThisMonth: 0,
        improvementRate: 0,
    })

    // Modal para ver reporte individual
    const [selectedReport, setSelectedReport] = useState(null)
    const [showReportModal, setShowReportModal] = useState(false)

    useEffect(() => {
        loadReports()
        loadStudents()
        loadStats()
    }, [filters])

    const loadReports = async () => {
        try {
            setLoading(true)
            // Simular llamada a API con filtros
            const data = await adminService.getAllReports(filters)
            setReports(data.reports || [])
            setPagination({
                total: data.total || 0,
                pages: data.pages || 0,
                currentPage: data.currentPage || 1,
            })
        } catch (error) {
            console.error("Error cargando reportes:", error)
            setError("Error cargando reportes del sistema")
        } finally {
            setLoading(false)
        }
    }

    const loadStudents = async () => {
        try {
            const data = await adminService.getStudentsOverview()
            setStudents(data.students || [])
        } catch (error) {
            console.error("Error cargando estudiantes:", error)
        }
    }

    const loadStats = async () => {
        try {
            const data = await adminService.getReportsStatistics()
            setStats(data.stats || stats)
        } catch (error) {
            console.error("Error cargando estadísticas:", error)
        }
    }

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1,
        }))
    }

    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }))
    }

    const clearFilters = () => {
        setFilters({
        search: "",
        studentId: "",
        dateFrom: "",
        dateTo: "",
        minScore: "",
        maxScore: "",
        examTitle: "",
        page: 1,
        limit: 15,
        })
    }

    const handleViewReport = async (reportId) => {
        try {
            const data = await adminService.getReportDetails(reportId)
            setSelectedReport(data.report)
            setShowReportModal(true)
        } catch (error) {
            console.error("Error cargando reporte:", error)
            setError("Error cargando detalles del reporte")
        }
    }

    const handleViewStudent = (studentId) => {
        navigate(`/admin/reports/student/${studentId}`)
    }

    const handleExportReports = async () => {
        try {
            const data = await adminService.exportReports(filters)
            // Crear y descargar archivo CSV
            const blob = new Blob([data.csv], { type: "text/csv" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `reportes_${new Date().toISOString().split("T")[0]}.csv`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error exportando reportes:", error)
            setError("Error exportando reportes")
        }
    }

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return "success"
        if (percentage >= 80) return "info"
        if (percentage >= 70) return "warning"
        return "danger"
    }

    const getScoreText = (percentage) => {
        if (percentage >= 90) return "Excelente"
        if (percentage >= 80) return "Muy Bueno"
        if (percentage >= 70) return "Bueno"
        if (percentage >= 60) return "Regular"
        return "Necesita Mejorar"
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        })
    }

    const renderPagination = () => {
        if (pagination.pages <= 1) return null

        const items = []
        const maxVisible = 5
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
        const endPage = Math.min(pagination.pages, startPage + maxVisible - 1)

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1)
        }

        // Primera página
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>,
            )
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" />)
            }
        }

        // Páginas visibles
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item key={page} active={page === pagination.currentPage} onClick={() => handlePageChange(page)}>
                    {page}
                </Pagination.Item>,
            )
        }

        // Última página
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" />)
            }
            items.push(
                <Pagination.Item key={pagination.pages} onClick={() => handlePageChange(pagination.pages)}>
                    {pagination.pages}
                </Pagination.Item>,
            )
        }

        return (
            <div className="d-flex justify-content-center mt-4">
                <Pagination>
                <Pagination.Prev
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                />
                {items}
                <Pagination.Next
                    disabled={pagination.currentPage === pagination.pages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                />
                </Pagination>
            </div>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={loadReports}>
                    Reintentar
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h1>Reportes del Sistema</h1>
            <p className="text-muted">Análisis y seguimiento del rendimiento estudiantil</p>
            </div>
            <div className="d-flex gap-2">
            <Button variant="success" onClick={handleExportReports}>
                <i className="bi bi-download me-2"></i>
                Exportar CSV
            </Button>
            <Button variant="primary" onClick={() => navigate("/admin/reports/statistics")}>
                <i className="bi bi-graph-up me-2"></i>
                Estadísticas Avanzadas
            </Button>
            </div>
        </div>

        {/* Estadísticas generales */}
        <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                <div className="display-4 text-primary mb-2">{stats.totalReports}</div>
                <Card.Title className="h6">Total Reportes</Card.Title>
                <small className="text-muted">Generados en el sistema</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-success">
                <Card.Body className="text-center">
                <div className="display-4 text-success mb-2">{Math.round(stats.averageScore)}%</div>
                <Card.Title className="h6">Promedio General</Card.Title>
                <small className="text-muted">De todos los estudiantes</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-info">
                <Card.Body className="text-center">
                <div className="display-4 text-info mb-2">{stats.studentsEvaluated}</div>
                <Card.Title className="h6">Estudiantes Evaluados</Card.Title>
                <small className="text-muted">Con al menos un examen</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                <div className="display-4 text-warning mb-2">{stats.reportsThisMonth}</div>
                <Card.Title className="h6">Reportes Este Mes</Card.Title>
                <small className="text-muted">Actividad reciente</small>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Filtros avanzados */}
        <Card className="mb-4">
            <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Filtros de Búsqueda</h6>
                <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                Limpiar Filtros
                </Button>
            </div>
            </Card.Header>
            <Card.Body>
            <Row>
                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Buscar estudiante</Form.Label>
                    <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Nombre o email..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                    <InputGroup.Text>
                        <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    </InputGroup>
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Estudiante específico</Form.Label>
                    <Form.Select
                    value={filters.studentId}
                    onChange={(e) => handleFilterChange("studentId", e.target.value)}
                    >
                    <option value="">Todos los estudiantes</option>
                    {students.map((student) => (
                        <option key={student.id} value={student.id}>
                        {student.name} - {student.email}
                        </option>
                    ))}
                    </Form.Select>
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Fecha desde</Form.Label>
                    <Form.Control
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    />
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Fecha hasta</Form.Label>
                    <Form.Control
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    />
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Puntaje mínimo</Form.Label>
                    <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={filters.minScore}
                    onChange={(e) => handleFilterChange("minScore", e.target.value)}
                    />
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Puntaje máximo</Form.Label>
                    <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={filters.maxScore}
                    onChange={(e) => handleFilterChange("maxScore", e.target.value)}
                    />
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Examen</Form.Label>
                    <Form.Control
                    type="text"
                    placeholder="Título del examen..."
                    value={filters.examTitle}
                    onChange={(e) => handleFilterChange("examTitle", e.target.value)}
                    />
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Por página</Form.Label>
                    <Form.Select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange("limit", Number.parseInt(e.target.value))}
                    >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    </Form.Select>
                </Form.Group>
                </Col>
            </Row>
            </Card.Body>
        </Card>

        {/* Lista de reportes */}
        <Card>
            <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Reportes del Sistema</h5>
                <Badge bg="secondary">{pagination.total} reportes</Badge>
            </div>
            </Card.Header>
            <Card.Body className="p-0">
            {loading ? (
                <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-5">
                <div className="text-muted mb-3">
                    <i className="bi bi-file-earmark-text display-1"></i>
                </div>
                <h5>No se encontraron reportes</h5>
                <p className="text-muted">
                    {Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 15)
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "No hay reportes generados en el sistema"}
                </p>
                </div>
            ) : (
                <>
                <div className="table-responsive">
                    <Table hover className="mb-0">
                    <thead className="table-light">
                        <tr>
                        <th>Estudiante</th>
                        <th>Examen</th>
                        <th>Fecha</th>
                        <th>Puntaje</th>
                        <th>Rendimiento</th>
                        <th>Progreso</th>
                        <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                        <tr key={report.id}>
                            <td>
                            <div className="fw-medium">{report.examResult?.user?.name || "Usuario"}</div>
                            <small className="text-muted">{report.examResult?.user?.email}</small>
                            </td>
                            <td>
                            <div className="fw-medium">{report.examResult?.exam?.title || "Examen"}</div>
                            <small className="text-muted">{report.examResult?.totalQuestions} preguntas</small>
                            </td>
                            <td>
                            <div>{formatDate(report.createdAt)}</div>
                            <small className="text-muted">
                                {new Date(report.createdAt).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                                })}
                            </small>
                            </td>
                            <td>
                            <Badge bg={getScoreColor(report.examResult?.percentage || 0)} className="fs-6">
                                {report.examResult?.percentage || 0}%
                            </Badge>
                            </td>
                            <td>
                            <Badge bg={getScoreColor(report.examResult?.percentage || 0)}>
                                {getScoreText(report.examResult?.percentage || 0)}
                            </Badge>
                            </td>
                            <td>
                            <div style={{ width: "100px" }}>
                                <ProgressBar
                                now={report.examResult?.percentage || 0}
                                variant={getScoreColor(report.examResult?.percentage || 0)}
                                style={{ height: "8px" }}
                                />
                            </div>
                            </td>
                            <td>
                            <div className="btn-group btn-group-sm">
                                <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewReport(report.id)}
                                title="Ver reporte"
                                >
                                <i className="bi bi-eye"></i>
                                </Button>
                                <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewStudent(report.examResult?.userId)}
                                title="Ver estudiante"
                                >
                                <i className="bi bi-person"></i>
                                </Button>
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </Table>
                </div>
                {renderPagination()}
                </>
            )}
            </Card.Body>
        </Card>

        {/* Modal para ver reporte individual */}
        <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>Detalles del Reporte</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            {selectedReport && (
                <div>
                <Row className="mb-3">
                    <Col md={6}>
                    <strong className="text-muted">Estudiante:</strong>
                    <div>{selectedReport.examResult?.user?.name}</div>
                    </Col>
                    <Col md={6}>
                    <strong className="text-muted">Examen:</strong>
                    <div>{selectedReport.examResult?.exam?.title}</div>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                    <strong className="text-muted">Puntaje:</strong>
                    <div>
                        <Badge bg={getScoreColor(selectedReport.examResult?.percentage || 0)} className="fs-6">
                        {selectedReport.examResult?.percentage || 0}%
                        </Badge>
                    </div>
                    </Col>
                    <Col md={6}>
                    <strong className="text-muted">Fecha:</strong>
                    <div>{formatDate(selectedReport.createdAt)}</div>
                    </Col>
                </Row>

                {selectedReport.strengths && selectedReport.strengths.length > 0 && (
                    <div className="mb-3">
                    <strong className="text-muted">Fortalezas:</strong>
                    <ul className="mt-1">
                        {selectedReport.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                        ))}
                    </ul>
                    </div>
                )}

                {selectedReport.weaknesses && selectedReport.weaknesses.length > 0 && (
                    <div className="mb-3">
                    <strong className="text-muted">Áreas de mejora:</strong>
                    <ul className="mt-1">
                        {selectedReport.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                        ))}
                    </ul>
                    </div>
                )}

                {selectedReport.assignedProfessor && (
                    <div className="mb-3">
                    <strong className="text-muted">Profesor recomendado:</strong>
                    <div>
                        {selectedReport.assignedProfessor} - {selectedReport.professorSubject}
                    </div>
                    </div>
                )}
                </div>
            )}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>
                Cerrar
            </Button>
            {selectedReport && (
                <Button
                variant="primary"
                onClick={() => {
                    setShowReportModal(false)
                    handleViewStudent(selectedReport.examResult?.userId)
                }}
                >
                Ver Perfil del Estudiante
                </Button>
            )}
            </Modal.Footer>
        </Modal>
        </Container>
    )
}

export default AdminReports
