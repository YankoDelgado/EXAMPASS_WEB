import { useState, useEffect } from "react"
import { Card, Row, Col, Spinner, Alert, Badge, ProgressBar } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { adminService } from "../../services/adminService"

const AdminDashboard = () => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    useEffect(() => {loadDashboardData()}, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            const data = await adminService.getDashboardStats()
            setStats(data)
        } catch (error) {
            setError("Error cargando datos del dashboard")
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    if(loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </div>
        )
    }

    if(error) {
        return (
            <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
            </Alert>
        )
    }

    return (
        <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Dashboard Administrativo</h1>
            <Badge bg="primary" className="fs-6">
            Sistema ExamPass
            </Badge>
        </div>

        {/* Estadísticas principales */}
        <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                <div className="display-4 text-primary mb-2">{stats?.overview?.totalStudents || 0}</div>
                <Card.Title className="h5">Estudiantes</Card.Title>
                <Card.Text className="text-muted">Registrados en el sistema</Card.Text>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-success">
                <Card.Body className="text-center">
                <div className="display-4 text-success mb-2">{stats?.overview?.totalQuestions || 0}</div>
                <Card.Title className="h5">Preguntas</Card.Title>
                <Card.Text className="text-muted">En el banco de preguntas</Card.Text>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-info">
                <Card.Body className="text-center">
                <div className="display-4 text-info mb-2">{stats?.overview?.totalExams || 0}</div>
                <Card.Title className="h5">Exámenes</Card.Title>
                <Card.Text className="text-muted">Creados en total</Card.Text>
                </Card.Body>
            </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
            <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                <div className="display-4 text-warning mb-2">{stats?.overview?.totalResults || 0}</div>
                <Card.Title className="h5">Resultados</Card.Title>
                <Card.Text className="text-muted">Exámenes completados</Card.Text>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Promedio general y distribución */}
        <Row className="mb-4">
            <Col lg={6} className="mb-3">
            <Card className="h-100">
                <Card.Header>
                <Card.Title className="mb-0">Rendimiento General</Card.Title>
                </Card.Header>
                <Card.Body>
                <div className="text-center mb-3">
                    <div className="display-5 text-primary">{stats?.overview?.averagePercentage || 0}%</div>
                    <p className="text-muted">Promedio general de calificaciones</p>
                </div>
                <ProgressBar
                    now={stats?.overview?.averagePercentage || 0}
                    variant={
                    (stats?.overview?.averagePercentage || 0) >= 80
                        ? "success"
                        : (stats?.overview?.averagePercentage || 0) >= 60
                        ? "warning"
                        : "danger"
                    }
                    className="mb-2"
                />
                <small className="text-muted">Basado en {stats?.overview?.totalResults || 0} exámenes completados</small>
                </Card.Body>
            </Card>
            </Col>

            <Col lg={6} className="mb-3">
            <Card className="h-100">
                <Card.Header>
                <Card.Title className="mb-0">Distribución de Puntajes</Card.Title>
                </Card.Header>
                <Card.Body>
                {stats?.scoreDistribution && (
                    <div className="space-y-2">
                    {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                        <div key={range} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-medium">{range}</span>
                        <div className="d-flex align-items-center">
                            <div
                            className="bg-primary me-2"
                            style={{
                                width: `${Math.max((count / stats.overview.totalResults) * 100, 5)}px`,
                                height: "8px",
                                borderRadius: "4px",
                            }}
                            ></div>
                            <Badge bg="secondary">{count}</Badge>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Acciones rápidas */}
        <Row className="mb-4">
            <Col lg={8} className="mb-3">
            <Card>
                <Card.Header>
                <Card.Title className="mb-0">Rendimiento por Materia</Card.Title>
                </Card.Header>
                <Card.Body>
                {stats?.subjectPerformance?.length > 0 ? (
                    <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Promedio</th>
                            <th>Evaluaciones</th>
                            <th>Estado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stats.subjectPerformance.slice(0, 5).map((subject, index) => (
                            <tr key={index}>
                            <td className="fw-medium">{subject.subject}</td>
                            <td>{subject.averagePercentage}%</td>
                            <td>{subject.totalEvaluations}</td>
                            <td>
                                <Badge
                                bg={
                                    subject.averagePercentage >= 80
                                    ? "success"
                                    : subject.averagePercentage >= 60
                                        ? "warning"
                                        : "danger"
                                }
                                >
                                {subject.averagePercentage >= 80
                                    ? "Excelente"
                                    : subject.averagePercentage >= 60
                                    ? "Bueno"
                                    : "Necesita mejora"}
                                </Badge>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p className="text-muted">No hay datos de rendimiento disponibles</p>
                )}
                </Card.Body>
            </Card>
            </Col>

            <Col lg={4} className="mb-3">
            <Card>
                <Card.Header>
                <Card.Title className="mb-0">Acciones Rápidas</Card.Title>
                </Card.Header>
                <Card.Body>
                <div className="d-grid gap-2">
                    <button className="btn btn-primary" onClick={() => navigate("/admin/professors/create")}>
                    Agregar Profesor
                    </button>
                    <button className="btn btn-success" onClick={() => navigate("/admin/questions/create")}>
                    Crear Pregunta
                    </button>
                    <button className="btn btn-info" onClick={() => navigate("/admin/exams/create")}>
                    Generar Examen
                    </button>
                    <button className="btn btn-warning" onClick={() => navigate("/admin/reports/statistics")}>
                    Ver Estadísticas
                    </button>
                </div>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </div>
    )
}

export default AdminDashboard