import { useState, useEffect } from "react"
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, ProgressBar, Table } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { adminService } from "../../../services/adminService"

const AdminStatistics = () => {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {loadStatistics()}, [])

    const loadStatistics = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await adminService.getDashboardStats()
            setStats(data)
        } catch (error) {
            console.error("Error cargando estadísticas:", error)
            setError("Error cargando estadísticas del sistema")
        } finally {
            setLoading(false)
        }
    }

    const getPerformanceColor = (percentage) => {
        if (percentage >= 80) return "success"
        if (percentage >= 60) return "warning"
        return "danger"
    }

    const getDifficultyColor = (correctRate) => {
        if (correctRate >= 80) return "success" // Fácil
        if (correctRate >= 50) return "warning" // Medio
        return "danger" // Difícil
    }

    const getDifficultyText = (correctRate) => {
        if (correctRate >= 80) return "Fácil"
        if (correctRate >= 50) return "Medio"
        return "Difícil"
    }

    const formatPercentage = (value) => {
        return Math.round(value || 0)
    }

    if (loading) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando estadísticas...</span>
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
                    <Button variant="outline-danger" onClick={loadStatistics}>
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

    if (!stats) {
        return (
            <Container>
                <Alert variant="warning">
                <Alert.Heading>Sin datos</Alert.Heading>
                <p>No hay estadísticas disponibles en este momento.</p>
                <Button variant="outline-warning" onClick={() => navigate("/admin/reports")}>
                    Volver a Reportes
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h1>Estadísticas del Sistema</h1>
            <p className="text-muted">Análisis detallado del rendimiento y uso del sistema</p>
            </div>
            <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate("/admin/reports")}>
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Reportes
            </Button>
            <Button variant="success" onClick={() => window.print()}>
                <i className="bi bi-printer me-2"></i>
                Imprimir
            </Button>
            </div>
        </div>

        {/* Resumen general */}
        <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                <div className="display-4 text-primary mb-2">{stats.overview?.totalStudents || 0}</div>
                <Card.Title className="h6">Estudiantes Activos</Card.Title>
                <small className="text-muted">Registrados en el sistema</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-success">
                <Card.Body className="text-center">
                <div className="display-4 text-success mb-2">{stats.overview?.totalResults || 0}</div>
                <Card.Title className="h6">Exámenes Completados</Card.Title>
                <small className="text-muted">Total de evaluaciones</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-info">
                <Card.Body className="text-center">
                <div className="display-4 text-info mb-2">{formatPercentage(stats.overview?.averagePercentage)}%</div>
                <Card.Title className="h6">Promedio General</Card.Title>
                <small className="text-muted">De todos los estudiantes</small>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                <div className="display-4 text-warning mb-2">{stats.overview?.totalQuestions || 0}</div>
                <Card.Title className="h6">Preguntas Activas</Card.Title>
                <small className="text-muted">En el banco de preguntas</small>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Distribución de puntajes */}
        <Row className="mb-4">
            <Col lg={6} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-bar-chart me-2"></i>
                    Distribución de Puntajes
                </h5>
                </Card.Header>
                <Card.Body>
                {stats.scoreDistribution && Object.keys(stats.scoreDistribution).length > 0 ? (
                    <div>
                    {Object.entries(stats.scoreDistribution).map(([range, count]) => {
                        const percentage = stats.overview?.totalResults ? (count / stats.overview.totalResults) * 100 : 0
                        return (
                        <div key={range} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-medium">{range}</span>
                            <div className="d-flex align-items-center gap-2">
                                <Badge bg="secondary">{count} estudiantes</Badge>
                                <small className="text-muted">{formatPercentage(percentage)}%</small>
                            </div>
                            </div>
                            <ProgressBar now={percentage} variant="primary" style={{ height: "12px" }} />
                        </div>
                        )
                    })}
                    </div>
                ) : (
                    <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No hay datos de distribución disponibles
                    </Alert>
                )}
                </Card.Body>
            </Card>
            </Col>

            <Col lg={6} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-graph-up me-2"></i>
                    Rendimiento por Materia
                </h5>
                </Card.Header>
                <Card.Body>
                {stats.subjectPerformance && stats.subjectPerformance.length > 0 ? (
                    <div>
                    {stats.subjectPerformance.slice(0, 8).map((subject, index) => (
                        <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-medium">{subject.subject}</span>
                            <div className="d-flex align-items-center gap-2">
                            <Badge bg={getPerformanceColor(subject.averagePercentage)}>
                                {subject.averagePercentage}%
                            </Badge>
                            <small className="text-muted">{subject.totalEvaluations} eval.</small>
                            </div>
                        </div>
                        <ProgressBar
                            now={subject.averagePercentage}
                            variant={getPerformanceColor(subject.averagePercentage)}
                            style={{ height: "10px" }}
                        />
                        </div>
                    ))}
                    </div>
                ) : (
                    <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No hay datos de rendimiento por materia
                    </Alert>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Preguntas más difíciles */}
        <Row className="mb-4">
            <Col lg={6} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Preguntas Más Difíciles
                </h5>
                </Card.Header>
                <Card.Body>
                {stats.difficultQuestions && stats.difficultQuestions.length > 0 ? (
                    <div className="table-responsive">
                    <Table size="sm" className="mb-0">
                        <thead>
                        <tr>
                            <th>Pregunta</th>
                            <th>Materia</th>
                            <th>Aciertos</th>
                            <th>Dificultad</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stats.difficultQuestions.slice(0, 5).map((question, index) => (
                            <tr key={index}>
                            <td>
                                <div className="fw-medium" style={{ maxWidth: "200px" }}>
                                {question.header?.substring(0, 50)}
                                {question.header?.length > 50 && "..."}
                                </div>
                            </td>
                            <td>
                                <Badge bg="info" className="text-wrap">
                                {question.subject}
                                </Badge>
                            </td>
                            <td>
                                <small>
                                {question.correctAnswers}/{question.totalAnswers}
                                </small>
                            </td>
                            <td>
                                <Badge bg={getDifficultyColor(question.correctRate)}>
                                {getDifficultyText(question.correctRate)}
                                </Badge>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                    </div>
                ) : (
                    <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No hay datos de dificultad de preguntas
                    </Alert>
                )}
                </Card.Body>
            </Card>
            </Col>

            <Col lg={6} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    Preguntas Más Fáciles
                </h5>
                </Card.Header>
                <Card.Body>
                {stats.easiestQuestions && stats.easiestQuestions.length > 0 ? (
                    <div className="table-responsive">
                    <Table size="sm" className="mb-0">
                        <thead>
                        <tr>
                            <th>Pregunta</th>
                            <th>Materia</th>
                            <th>Aciertos</th>
                            <th>Dificultad</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stats.easiestQuestions.map((question, index) => (
                            <tr key={index}>
                            <td>
                                <div className="fw-medium" style={{ maxWidth: "200px" }}>
                                {question.header?.substring(0, 50)}
                                {question.header?.length > 50 && "..."}
                                </div>
                            </td>
                            <td>
                                <Badge bg="info" className="text-wrap">
                                {question.subject}
                                </Badge>
                            </td>
                            <td>
                                <small>
                                {question.correctAnswers}/{question.totalAnswers}
                                </small>
                            </td>
                            <td>
                                <Badge bg={getDifficultyColor(question.correctRate)}>
                                {getDifficultyText(question.correctRate)}
                                </Badge>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                    </div>
                ) : (
                    <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    No hay datos de preguntas fáciles
                    </Alert>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Resumen de mejores y peores materias */}
        <Row className="mb-4">
            <Col>
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-trophy me-2"></i>
                    Resumen de Rendimiento Académico
                </h5>
                </Card.Header>
                <Card.Body>
                <Row>
                    <Col md={6}>
                    <div className="mb-3">
                        <h6 className="text-success">
                        <i className="bi bi-arrow-up-circle me-2"></i>
                        Mejores Materias
                        </h6>
                        {stats.subjectPerformance && stats.subjectPerformance.length > 0 ? (
                        <div>
                            {stats.subjectPerformance
                            .slice(0, 3)
                            .filter((subject) => subject.averagePercentage >= 80)
                            .map((subject, index) => (
                                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                <span>{subject.subject}</span>
                                <Badge bg="success">{subject.averagePercentage}%</Badge>
                                </div>
                            ))}
                            {stats.subjectPerformance.filter((subject) => subject.averagePercentage >= 80).length === 0 && (
                            <small className="text-muted">No hay materias con rendimiento excelente aún</small>
                            )}
                        </div>
                        ) : (
                        <small className="text-muted">Sin datos disponibles</small>
                        )}
                    </div>
                    </Col>

                    <Col md={6}>
                    <div className="mb-3">
                        <h6 className="text-warning">
                        <i className="bi bi-arrow-down-circle me-2"></i>
                        Materias que Necesitan Atención
                        </h6>
                        {stats.subjectPerformance && stats.subjectPerformance.length > 0 ? (
                        <div>
                            {stats.subjectPerformance
                            .slice(-3)
                            .reverse()
                            .filter((subject) => subject.averagePercentage < 70)
                            .map((subject, index) => (
                                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                <span>{subject.subject}</span>
                                <Badge bg="warning">{subject.averagePercentage}%</Badge>
                                </div>
                            ))}
                            {stats.subjectPerformance.filter((subject) => subject.averagePercentage < 70).length === 0 && (
                            <small className="text-muted">¡Todas las materias tienen buen rendimiento!</small>
                            )}
                        </div>
                        ) : (
                        <small className="text-muted">Sin datos disponibles</small>
                        )}
                    </div>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Recomendaciones del sistema */}
        <Row>
            <Col>
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-lightbulb me-2"></i>
                    Recomendaciones del Sistema
                </h5>
                </Card.Header>
                <Card.Body>
                <Row>
                    <Col md={6}>
                    <Alert variant="info">
                        <h6>
                        <i className="bi bi-graph-up me-2"></i>
                        Rendimiento General
                        </h6>
                        <p className="mb-2">
                        El promedio general del sistema es de{" "}
                        <strong>{formatPercentage(stats.overview?.averagePercentage)}%</strong>
                        </p>
                        {stats.overview?.averagePercentage >= 80 ? (
                        <small>¡Excelente! El sistema mantiene un alto nivel académico.</small>
                        ) : stats.overview?.averagePercentage >= 70 ? (
                        <small>Buen rendimiento general. Considera reforzar las materias más débiles.</small>
                        ) : (
                        <small>
                            El rendimiento puede mejorar. Revisa las preguntas más difíciles y considera ajustar el
                            contenido.
                        </small>
                        )}
                    </Alert>
                    </Col>

                    <Col md={6}>
                    <Alert variant="warning">
                        <h6>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Acciones Sugeridas
                        </h6>
                        <ul className="mb-0">
                        {stats.difficultQuestions && stats.difficultQuestions.length > 0 && (
                            <li>Revisar las {stats.difficultQuestions.length} preguntas más difíciles</li>
                        )}
                        {stats.subjectPerformance &&
                            stats.subjectPerformance.filter((s) => s.averagePercentage < 70).length > 0 && (
                            <li>
                                Reforzar contenido en{" "}
                                {stats.subjectPerformance.filter((s) => s.averagePercentage < 70).length} materias
                            </li>
                            )}
                        <li>Generar más preguntas para materias con mejor rendimiento</li>
                        <li>Considerar tutorías para estudiantes con bajo rendimiento</li>
                        </ul>
                    </Alert>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    )
}

export default AdminStatistics