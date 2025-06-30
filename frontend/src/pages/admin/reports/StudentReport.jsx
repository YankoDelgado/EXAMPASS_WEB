import { useState, useEffect } from "react"
import {Container,Card,Button,Alert,Row,Col,Badge,Spinner,ProgressBar,ListGroup,Table,Nav,Tab,} from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import { adminService } from "../../../services/adminService"

const StudentReport = () => {
    const navigate = useNavigate()
    const { userId } = useParams()
    const [student, setStudent] = useState(null)
    const [reports, setReports] = useState([])
    const [examResults, setExamResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useState("overview")

    // Estadísticas del estudiante
    const [stats, setStats] = useState({
        totalExams: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        improvementRate: 0,
        totalStudyTime: 0,
        strongSubjects: [],
        weakSubjects: [],
        recentActivity: [],
    })

    useEffect(() => {
        if (userId) {
            loadStudentData()
        }
    }, [userId])

    const loadStudentData = async () => {
        try {
            setLoading(true)
            setError("")

            // Cargar datos del estudiante
            const [studentData, reportsData, resultsData, statsData] = await Promise.all([
                adminService.getStudentDetails(userId),
                adminService.getStudentReports(userId),
                adminService.getStudentExamResults(userId),
                adminService.getStudentStatistics(userId),
            ])

            setStudent(studentData.student)
            setReports(reportsData.reports || [])
            setExamResults(resultsData.results || [])
            setStats(statsData.stats || stats)
        } catch (error) {
            console.error("Error cargando datos del estudiante:", error)
            if (error.response?.status === 404) {
                setError("Estudiante no encontrado")
            } else {
                setError("Error cargando los datos del estudiante")
            }
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return "success"
        if (percentage >= 80) return "info"
        if (percentage >= 70) return "warning"
        return "danger"
    }

    const getPerformanceLevel = (percentage) => {
        if (percentage >= 90) return { level: "Excelente", icon: "bi-trophy-fill", color: "success" }
        if (percentage >= 80) return { level: "Muy Bueno", icon: "bi-star-fill", color: "info" }
        if (percentage >= 70) return { level: "Bueno", icon: "bi-check-circle-fill", color: "warning" }
        if (percentage >= 60) return { level: "Regular", icon: "bi-check-circle", color: "primary" }
        return { level: "Necesita Mejorar", icon: "bi-x-circle-fill", color: "danger" }
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

    const calculateTrend = () => {
        if (examResults.length < 2) return { trend: "neutral", percentage: 0 }

        const recent = examResults.slice(-3).map((r) => r.percentage)
        const older = examResults.slice(-6, -3).map((r) => r.percentage)

        if (recent.length === 0 || older.length === 0) return { trend: "neutral", percentage: 0 }

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
        const diff = recentAvg - olderAvg

        if (diff > 5) return { trend: "up", percentage: diff }
        if (diff < -5) return { trend: "down", percentage: Math.abs(diff) }
        return { trend: "neutral", percentage: Math.abs(diff) }
    }

    if (loading) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando datos del estudiante...</span>
                </Spinner>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <div className="d-flex gap-2">
                    <Button variant="outline-danger" onClick={loadStudentData}>
                    Reintentar
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/admin/reports")}>
                    Volver a Reportes
                    </Button>
                </div>
                </Alert>
            </Container>
        )
    }

    if (!student) {
        return (
            <Container>
                <Alert variant="warning">
                <Alert.Heading>Estudiante no encontrado</Alert.Heading>
                <p>El estudiante que buscas no existe o no tienes permisos para verlo.</p>
                <Button variant="outline-warning" onClick={() => navigate("/admin/reports")}>
                    Volver a Reportes
                </Button>
                </Alert>
            </Container>
        )
    }

    const performance = getPerformanceLevel(stats.averageScore)
    const trend = calculateTrend()

    return (
        <Container>
        {/* Header del estudiante */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h1>Perfil del Estudiante</h1>
            <div className="d-flex align-items-center gap-3">
                <h4 className="text-primary mb-0">{student.name}</h4>
                <Badge bg="secondary">{student.email}</Badge>
                <Badge bg={student.isActive ? "success" : "danger"}>{student.isActive ? "Activo" : "Inactivo"}</Badge>
            </div>
            </div>
            <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate(`/admin/students/${userId}`)}>
                <i className="bi bi-person me-2"></i>
                Ver Perfil Completo
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/reports")}>
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Reportes
            </Button>
            </div>
        </div>

        {/* Estadísticas generales */}
        <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                <div className="display-4 text-primary mb-2">{stats.totalExams}</div>
                <Card.Title className="h6">Exámenes Realizados</Card.Title>
                <small className="text-muted">Total completados</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-success">
                <Card.Body className="text-center">
                <div className="display-4 text-success mb-2">{Math.round(stats.averageScore)}%</div>
                <Card.Title className="h6">Promedio General</Card.Title>
                <small className="text-muted">
                    <i className={`bi bi-${performance.icon} me-1`}></i>
                    {performance.level}
                </small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-info">
                <Card.Body className="text-center">
                <div className="display-4 text-info mb-2">{stats.bestScore}%</div>
                <Card.Title className="h6">Mejor Puntaje</Card.Title>
                <small className="text-muted">Máximo alcanzado</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                    <span className="display-4 text-warning me-2">{Math.round(stats.improvementRate)}%</span>
                    {trend.trend === "up" && <i className="bi bi-trend-up text-success fs-3"></i>}
                    {trend.trend === "down" && <i className="bi bi-trend-down text-danger fs-3"></i>}
                    {trend.trend === "neutral" && <i className="bi bi-dash text-muted fs-3"></i>}
                </div>
                <Card.Title className="h6">Tendencia</Card.Title>
                <small className="text-muted">
                    {trend.trend === "up" && "Mejorando"}
                    {trend.trend === "down" && "Necesita atención"}
                    {trend.trend === "neutral" && "Estable"}
                </small>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Pestañas de contenido */}
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="mb-4">
            <Nav.Item>
                <Nav.Link eventKey="overview">
                <i className="bi bi-graph-up me-2"></i>
                Resumen General
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="exams">
                <i className="bi bi-file-earmark-text me-2"></i>
                Historial de Exámenes
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="reports">
                <i className="bi bi-clipboard-data me-2"></i>
                Reportes Detallados
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="analysis">
                <i className="bi bi-bar-chart me-2"></i>
                Análisis de Rendimiento
                </Nav.Link>
            </Nav.Item>
            </Nav>

            <Tab.Content>
            {/* Pestaña: Resumen General */}
            <Tab.Pane eventKey="overview">
                <Row>
                <Col lg={8} className="mb-4">
                    <Card>
                    <Card.Header>
                        <h5 className="mb-0">Progreso Académico</h5>
                    </Card.Header>
                    <Card.Body>
                        {examResults.length > 0 ? (
                        <div>
                            <div className="mb-4">
                            <h6 className="text-muted mb-3">Últimos 10 Exámenes</h6>
                            <div className="d-flex gap-2 flex-wrap">
                                {examResults.slice(-10).map((result, index) => (
                                <div key={result.id} className="text-center">
                                    <div
                                    className={`badge bg-${getScoreColor(result.percentage)} mb-1`}
                                    style={{ fontSize: "0.8rem", padding: "0.5rem" }}
                                    >
                                    {result.percentage}%
                                    </div>
                                    <div className="small text-muted">#{index + 1}</div>
                                </div>
                                ))}
                            </div>
                            </div>

                            <div className="mb-4">
                            <h6 className="text-muted mb-3">Distribución de Puntajes</h6>
                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                <span>90-100% (Excelente)</span>
                                <span>{examResults.filter((r) => r.percentage >= 90).length} exámenes</span>
                                </div>
                                <ProgressBar
                                now={(examResults.filter((r) => r.percentage >= 90).length / examResults.length) * 100}
                                variant="success"
                                style={{ height: "8px" }}
                                />
                            </div>
                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                <span>80-89% (Muy Bueno)</span>
                                <span>
                                    {examResults.filter((r) => r.percentage >= 80 && r.percentage < 90).length} exámenes
                                </span>
                                </div>
                                <ProgressBar
                                now={
                                    (examResults.filter((r) => r.percentage >= 80 && r.percentage < 90).length /
                                    examResults.length) *
                                    100
                                }
                                variant="info"
                                style={{ height: "8px" }}
                                />
                            </div>
                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                <span>70-79% (Bueno)</span>
                                <span>
                                    {examResults.filter((r) => r.percentage >= 70 && r.percentage < 80).length} exámenes
                                </span>
                                </div>
                                <ProgressBar
                                now={
                                    (examResults.filter((r) => r.percentage >= 70 && r.percentage < 80).length /
                                    examResults.length) *
                                    100
                                }
                                variant="warning"
                                style={{ height: "8px" }}
                                />
                            </div>
                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                <span>Menos de 70% (Necesita Mejorar)</span>
                                <span>{examResults.filter((r) => r.percentage < 70).length} exámenes</span>
                                </div>
                                <ProgressBar
                                now={(examResults.filter((r) => r.percentage < 70).length / examResults.length) * 100}
                                variant="danger"
                                style={{ height: "8px" }}
                                />
                            </div>
                            </div>
                        </div>
                        ) : (
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            Este estudiante aún no ha realizado ningún examen.
                        </Alert>
                        )}
                    </Card.Body>
                    </Card>
                </Col>

                <Col lg={4} className="mb-4">
                    <Card className="mb-3">
                    <Card.Header className="bg-success text-white">
                        <h6 className="mb-0">
                        <i className="bi bi-check-circle me-2"></i>
                        Materias Fuertes
                        </h6>
                    </Card.Header>
                    <Card.Body>
                        {stats.strongSubjects && stats.strongSubjects.length > 0 ? (
                        <ListGroup variant="flush">
                            {stats.strongSubjects.map((subject, index) => (
                            <ListGroup.Item key={index} className="px-0 py-2 d-flex justify-content-between">
                                <span>{subject.name}</span>
                                <Badge bg="success">{subject.average}%</Badge>
                            </ListGroup.Item>
                            ))}
                        </ListGroup>
                        ) : (
                        <p className="text-muted mb-0">
                            <i className="bi bi-info-circle me-2"></i>
                            Datos insuficientes para determinar materias fuertes.
                        </p>
                        )}
                    </Card.Body>
                    </Card>

                    <Card>
                    <Card.Header className="bg-warning text-dark">
                        <h6 className="mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Materias a Reforzar
                        </h6>
                    </Card.Header>
                    <Card.Body>
                        {stats.weakSubjects && stats.weakSubjects.length > 0 ? (
                        <ListGroup variant="flush">
                            {stats.weakSubjects.map((subject, index) => (
                            <ListGroup.Item key={index} className="px-0 py-2 d-flex justify-content-between">
                                <span>{subject.name}</span>
                                <Badge bg="warning">{subject.average}%</Badge>
                            </ListGroup.Item>
                            ))}
                        </ListGroup>
                        ) : (
                        <p className="text-muted mb-0">
                            <i className="bi bi-check-circle me-2"></i>
                            No se identificaron materias que requieran refuerzo especial.
                        </p>
                        )}
                    </Card.Body>
                    </Card>
                </Col>
                </Row>
            </Tab.Pane>

            {/* Pestaña: Historial de Exámenes */}
            <Tab.Pane eventKey="exams">
                <Card>
                <Card.Header>
                    <h5 className="mb-0">Historial Completo de Exámenes</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {examResults.length > 0 ? (
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                        <thead className="table-light">
                            <tr>
                            <th>Examen</th>
                            <th>Fecha</th>
                            <th>Puntaje</th>
                            <th>Tiempo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {examResults.map((result) => (
                            <tr key={result.id}>
                                <td>
                                <div className="fw-medium">{result.exam?.title || "Examen"}</div>
                                <small className="text-muted">{result.totalQuestions} preguntas</small>
                                </td>
                                <td>
                                <div>{formatDate(result.completedAt)}</div>
                                </td>
                                <td>
                                <Badge bg={getScoreColor(result.percentage)} className="fs-6">
                                    {result.percentage}%
                                </Badge>
                                <div className="small text-muted">
                                    {result.correctAnswers}/{result.totalQuestions}
                                </div>
                                </td>
                                <td>
                                <div>{Math.round(result.timeSpent / 60)} min</div>
                                <small className="text-muted">de {result.exam?.timeLimit} min</small>
                                </td>
                                <td>
                                <Badge bg={result.percentage >= 70 ? "success" : "danger"}>
                                    {result.percentage >= 70 ? "Aprobado" : "Reprobado"}
                                </Badge>
                                </td>
                                <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate(`/admin/exams/${result.examId}/results`)}
                                >
                                    <i className="bi bi-eye"></i>
                                </Button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    </div>
                    ) : (
                    <div className="text-center py-5">
                        <div className="text-muted mb-3">
                        <i className="bi bi-file-earmark-text display-1"></i>
                        </div>
                        <h5>No hay exámenes realizados</h5>
                        <p className="text-muted">Este estudiante aún no ha completado ningún examen.</p>
                    </div>
                    )}
                </Card.Body>
                </Card>
            </Tab.Pane>

            {/* Pestaña: Reportes Detallados */}
            <Tab.Pane eventKey="reports">
                <Card>
                <Card.Header>
                    <h5 className="mb-0">Reportes Generados</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {reports.length > 0 ? (
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                        <thead className="table-light">
                            <tr>
                            <th>Reporte</th>
                            <th>Fecha</th>
                            <th>Examen</th>
                            <th>Puntaje</th>
                            <th>Profesor Asignado</th>
                            <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                            <tr key={report.id}>
                                <td>
                                <div className="fw-medium">Reporte #{report.id.slice(-8)}</div>
                                <small className="text-muted">Análisis detallado</small>
                                </td>
                                <td>{formatDate(report.createdAt)}</td>
                                <td>
                                <div>{report.examResult?.exam?.title}</div>
                                </td>
                                <td>
                                <Badge bg={getScoreColor(report.examResult?.percentage || 0)}>
                                    {report.examResult?.percentage || 0}%
                                </Badge>
                                </td>
                                <td>
                                {report.assignedProfessor ? (
                                    <div>
                                    <div className="fw-medium">{report.assignedProfessor}</div>
                                    <small className="text-muted">{report.professorSubject}</small>
                                    </div>
                                ) : (
                                    <span className="text-muted">No asignado</span>
                                )}
                                </td>
                                <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate(`/student/reports/${report.id}`)}
                                >
                                    <i className="bi bi-eye"></i>
                                </Button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    </div>
                    ) : (
                    <div className="text-center py-5">
                        <div className="text-muted mb-3">
                        <i className="bi bi-clipboard-data display-1"></i>
                        </div>
                        <h5>No hay reportes generados</h5>
                        <p className="text-muted">No se han generado reportes detallados para este estudiante.</p>
                    </div>
                    )}
                </Card.Body>
                </Card>
            </Tab.Pane>

            {/* Pestaña: Análisis de Rendimiento */}
            <Tab.Pane eventKey="analysis">
                <Row>
                <Col lg={6} className="mb-4">
                    <Card>
                    <Card.Header>
                        <h6 className="mb-0">Información del Estudiante</h6>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                        <Col sm={6}>
                            <div className="mb-3">
                            <strong className="text-muted">Nombre completo:</strong>
                            <div>{student.name}</div>
                            </div>
                            <div className="mb-3">
                            <strong className="text-muted">Email:</strong>
                            <div>{student.email}</div>
                            </div>
                            <div className="mb-3">
                            <strong className="text-muted">Fecha de registro:</strong>
                            <div>{formatDate(student.createdAt)}</div>
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="mb-3">
                            <strong className="text-muted">Estado:</strong>
                            <div>
                                <Badge bg={student.isActive ? "success" : "danger"}>
                                {student.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                            </div>
                            </div>
                            <div className="mb-3">
                            <strong className="text-muted">Última actividad:</strong>
                            <div>{student.lastLoginAt ? formatDate(student.lastLoginAt) : "Nunca"}</div>
                            </div>
                            <div className="mb-3">
                            <strong className="text-muted">ID del estudiante:</strong>
                            <div>
                                <code>{student.id}</code>
                            </div>
                            </div>
                        </Col>
                        </Row>
                    </Card.Body>
                    </Card>
                </Col>

                <Col lg={6} className="mb-4">
                    <Card>
                    <Card.Header>
                        <h6 className="mb-0">Recomendaciones</h6>
                    </Card.Header>
                    <Card.Body>
                        {stats.averageScore >= 90 ? (
                        <Alert variant="success">
                            <i className="bi bi-trophy me-2"></i>
                            <strong>¡Excelente rendimiento!</strong> Este estudiante demuestra un dominio excepcional del
                            material. Considera ofrecerle desafíos adicionales o material avanzado.
                        </Alert>
                        ) : stats.averageScore >= 80 ? (
                        <Alert variant="info">
                            <i className="bi bi-star me-2"></i>
                            <strong>Muy buen rendimiento.</strong> El estudiante está progresando bien. Continúa
                            monitoreando su desarrollo y proporciona retroalimentación constructiva.
                        </Alert>
                        ) : stats.averageScore >= 70 ? (
                        <Alert variant="warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Rendimiento satisfactorio.</strong> El estudiante necesita apoyo adicional en algunas
                            áreas. Considera sesiones de refuerzo o tutorías personalizadas.
                        </Alert>
                        ) : (
                        <Alert variant="danger">
                            <i className="bi bi-exclamation-circle me-2"></i>
                            <strong>Necesita atención inmediata.</strong> El estudiante requiere intervención pedagógica
                            urgente. Programa sesiones de apoyo intensivo y seguimiento cercano.
                        </Alert>
                        )}

                        {trend.trend === "down" && (
                        <Alert variant="warning">
                            <i className="bi bi-trend-down me-2"></i>
                            <strong>Tendencia descendente detectada.</strong> El rendimiento ha disminuido recientemente.
                            Investiga posibles causas y proporciona apoyo adicional.
                        </Alert>
                        )}

                        {stats.totalExams === 0 && (
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Sin actividad de exámenes.</strong> Este estudiante no ha realizado ningún examen.
                            Considera contactarlo para verificar su participación en el curso.
                        </Alert>
                        )}
                    </Card.Body>
                    </Card>
                </Col>
                </Row>
            </Tab.Pane>
            </Tab.Content>
        </Tab.Container>
        </Container>
    )
}

export default StudentReport