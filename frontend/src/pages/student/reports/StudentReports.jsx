import { useState, useEffect } from "react"
import {Container,Card,Table,Button,Form,Row,Col,Badge,Spinner,Alert,InputGroup,Pagination,ProgressBar} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { studentService } from "../../../services/studentService"

const StudentReports = () => {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Filtros y búsqueda
    const [filters, setFilters] = useState({
        search: "",
        dateFrom: "",
        dateTo: "",
        minScore: "",
        maxScore: "",
        page: 1,
        limit: 10,
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
        bestScore: 0,
        lastExamDate: null,
        improvementTrend: "stable",
    })

    useEffect(() => {
        loadReports()
        loadPersonalStats()
    }, [filters])

    const loadReports = async () => {
        try {
            setLoading(true);
            setError("");
            
            const response = await studentService.getMyReports(filters);
            
            if (!response.success) {
                throw new Error(response.error || "Error al cargar reportes");
            }

            // Procesamiento seguro de reportes
            const processedReports = response.reports.map(report => {
                const percentage = report.examResult?.percentage || 0;
                const examTitle = report.examResult?.exam?.title || "Examen sin título";
                const completedAt = report.examResult?.completedAt 
                    ? new Date(report.examResult.completedAt)
                    : new Date();

                return {
                    ...report,
                    id: report.id || Math.random().toString(36).substring(2, 9),
                    examResult: {
                        ...report.examResult,
                        percentage,
                        completedAt: completedAt.toISOString(),
                        totalQuestions: report.examResult?.totalQuestions || 0,
                        exam: {
                            title: examTitle,
                            description: report.examResult?.exam?.description || ""
                        }
                    }
                };
            });

            setReports(processedReports);
            setPagination(response.pagination);
            
            // Actualizar estadísticas solo si hay datos
            if (response.stats && processedReports.length > 0) {
                setStats({
                    totalReports: response.stats.totalReports,
                    averageScore: Math.round(response.stats.averageScore),
                    bestScore: Math.round(response.stats.bestScore),
                    lastExamDate: processedReports[0]?.examResult?.completedAt || null,
                    improvementTrend: calculateTrend(processedReports)
                });
            }

        } catch (error) {
            setError(error.message);
            setReports([]);
            console.error("Error en loadReports:", {
                error: error.message,
                filters
            });
        } finally {
            setLoading(false);
        }
    };

    // Función auxiliar para calcular tendencia
    const calculateTrend = (reports) => {
        if (reports.length < 2) return "stable";
        
        const lastThree = reports.slice(0, 3).map(r => r.examResult.percentage);
        const avgRecent = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
        const avgPrevious = reports.length > 3 
            ? reports.slice(3, 6).reduce((a, r) => a + r.examResult.percentage, 0) / 3
            : avgRecent;
        
        return avgRecent > avgPrevious + 5 ? "improving" 
            : avgRecent < avgPrevious - 5 ? "declining" 
            : "stable";
    };

    const loadPersonalStats = async () => {
    try {
        const response = await studentService.getPersonalStats();
        console.log("Estadísticas recibidas:", response); // ← Log de diagnóstico
        
        if (response.success) {
            setStats({
                totalReports: response.stats?.totalReports || 0,
                averageScore: response.stats?.averageScore || 0,
                bestScore: response.stats?.bestScore || 0,
                lastExamDate: response.stats?.lastExamDate || null,
                improvementTrend: response.stats?.improvementTrend || "stable"
            });
        }
    } catch (error) {
        console.error("Error cargando estadísticas:", error);
    }
};

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
        dateFrom: "",
        dateTo: "",
        minScore: "",
        maxScore: "",
        page: 1,
        limit: 10,
        })
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

    const getTrendIcon = (trend) => {
        switch (trend) {
            case "improving":
                return "bi-trending-up text-success"
            case "declining":
                return "bi-trending-down text-danger"
            default:
                return "bi-dash text-muted"
        }
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
            <h1>Mis Reportes</h1>
            <p className="text-muted">Revisa tu progreso y rendimiento académico</p>
            </div>
            <Button variant="outline-primary" onClick={() => navigate("/student/dashboard")}>
            Volver al Dashboard
            </Button>
        </div>

        {/* Estadísticas generales */}
        <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                <div className="display-4 text-primary mb-2">{stats.totalReports}</div>
                <Card.Title className="h6">Exámenes Realizados</Card.Title>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-success">
                <Card.Body className="text-center">
                <div className="display-4 text-success mb-2">{Math.round(stats.averageScore)}%</div>
                <Card.Title className="h6">Promedio General</Card.Title>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                <div className="display-4 text-warning mb-2">{stats.bestScore}%</div>
                <Card.Title className="h6">Mejor Puntaje</Card.Title>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-info">
                <Card.Body className="text-center">
                <div className="mb-2">
                    <i className={`${getTrendIcon(stats.improvementTrend)} display-4`}></i>
                </div>
                <Card.Title className="h6">Tendencia</Card.Title>
                <small className="text-muted">
                    {stats.improvementTrend === "improving"
                    ? "Mejorando"
                    : stats.improvementTrend === "declining"
                        ? "Declinando"
                        : "Estable"}
                </small>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Filtros */}
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
                <Col md={6} lg={4}>
                <Form.Group className="mb-3">
                    <Form.Label>Buscar examen</Form.Label>
                    <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Nombre del examen..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                    <InputGroup.Text>
                        <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    </InputGroup>
                </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                <Form.Group className="mb-3">
                    <Form.Label>Fecha desde</Form.Label>
                    <Form.Control
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    />
                </Form.Group>
                </Col>

                <Col md={6} lg={4}>
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
                    <Form.Label>Por página</Form.Label>
                    <Form.Select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange("limit", Number.parseInt(e.target.value))}
                    >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
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
                <h5 className="mb-0">Historial de Reportes</h5>
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
                    {Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 10)
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Completa tu primer examen para generar reportes"}
                </p>
                {!Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 10) && (
                    <Button variant="primary" onClick={() => navigate("/student/exam")}>
                    Tomar Examen
                    </Button>
                )}
                </div>
            ) : (
                <>
                <div className="table-responsive">
                    <Table hover className="mb-0">
                    <thead className="table-light">
                        <tr>
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
                            <div className="fw-medium">{report.examResult.exam.title}</div>
                            <small className="text-muted">{report.examResult.totalQuestions} preguntas</small>
                            </td>
                            <td>
                            <div>{formatDate(report.examResult.completedAt)}</div>
                            <small className="text-muted">
                                {new Date(report.examResult.completedAt).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                                })}
                            </small>
                            </td>
                            <td>
                            <div className="d-flex align-items-center">
                                <Badge bg={getScoreColor(report.examResult.percentage || 0)} className="me-2">
                                {report.examResult.percentage || 0}%
                                </Badge>
                            </div>
                            </td>
                            <td>
                            <Badge bg={getScoreColor(report.examResult.percentage || 0)}>
                                {getScoreText(report.examResult.percentage || 0)}
                            </Badge>
                            </td>
                            <td>
                            <div style={{ width: "100px" }}>
                                <ProgressBar
                                now={report.examResult.percentage || 0}
                                variant={getScoreColor(report.examResult.percentage || 0)}
                                style={{ height: "8px" }}
                                />
                            </div>
                            </td>
                            <td>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/student/reports/${report.id}`)}
                            >
                                <i className="bi bi-eye me-1"></i>
                                Ver Reporte
                            </Button>
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

        {/* Resumen de progreso */}
        {reports.length > 0 && (
            <Row className="mt-4">
            <Col>
                <Card>
                <Card.Header>
                    <h6 className="mb-0">Resumen de Progreso</h6>
                </Card.Header>
                <Card.Body>
                    <Row>
                    <Col md={6}>
                        <div className="mb-3">
                        <strong className="text-muted d-block">Último examen:</strong>
                        <span>{reports[0].examResult.exam.title}</span>
                        <Badge bg={getScoreColor(reports[0].examResult.percentage || 0)} className="ms-2">
                            {reports[0]?.examResult?.percentage || 0}%
                        </Badge>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="mb-3">
                        <strong className="text-muted d-block">Próximo objetivo:</strong>
                        <span>
                            {stats.averageScore < 90
                            ? `Alcanzar ${Math.ceil(stats.averageScore / 10) * 10}% de promedio`
                            : "¡Mantener la excelencia!"}
                        </span>
                        </div>
                    </Col>
                    </Row>
                </Card.Body>
                </Card>
            </Col>
            </Row>
        )}
        </Container>
    )
}

export default StudentReports