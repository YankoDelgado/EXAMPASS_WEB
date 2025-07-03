import { useState, useEffect } from "react"
import { Card, Row, Col, Button, Alert, Badge, Spinner } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { examService } from "../../services/examService"
import { studentService } from "../../services/studentService"

const StudentDashboard = () => {
    const {user} = useAuth()
    const navigate = useNavigate()
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {loadDashboardData()}, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            
            const [availableExamsResponse, myReports, lastResult] = await Promise.all([
                examService.getAvailableExams(true),
                studentService.getMyReports().catch(e => ({ reports: [], error: e.message })),
                studentService.getLastResult().catch(() => null)
            ]);

            // Verificar si hay error en availableExams
            const availableExams = availableExamsResponse.success 
                ? { exams: availableExamsResponse.exams, message: availableExamsResponse.message }
                : { exams: [], error: availableExamsResponse.error }

            setDashboardData({
                availableExams,
                myReports,
                lastResult
            });

            if (!availableExamsResponse.success || myReports.error) {
                setError(availableExamsResponse.error || myReports.error || "Error cargando datos");
            }
        } catch (error) {
            setError("Error cargando datos del dashboard")
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Buenos días"
        if (hour < 18) return "Buenas tardes"
        return "Buenas noches"
    }

    const getPerformanceColor = (percentage) => {
        if (percentage >= 90) return "success"
        if (percentage >= 80) return "info"
        if (percentage >= 70) return "warning"
        return "danger"
    }

    const getPerformanceText = (percentage) => {
        if (percentage >= 90) return "Excelente"
        if (percentage >= 80) return "Muy Bueno"
        if (percentage >= 70) return "Bueno"
        if (percentage >= 60) return "Regular"
        return "Necesita Mejorar"
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

    if (error) {
        return (
            <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={loadDashboardData}>
                Reintentar
                </Button>
            </Alert>
        )
    }

    return (
        <div>
        {/* Saludo personalizado */}
        <div className="mb-4">
            <h1 className="display-6">
            {getGreeting()}, <span className="text-primary">{user?.name}</span>
            </h1>
            <p className="text-muted">¿Listo para demostrar tus conocimientos?</p>
        </div>

        {/* Último resultado */}
        {dashboardData?.lastResult && (
            <Alert variant="info" className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
                <div>
                <Alert.Heading className="h5 mb-1">Último Examen Completado</Alert.Heading>
                <p className="mb-0">
                    <strong>{dashboardData.lastResult.exam?.title}</strong> - Puntaje:{" "}
                    <Badge bg={getPerformanceColor(dashboardData.lastResult.percentage)}>
                    {dashboardData.lastResult.percentage}%
                    </Badge>
                </p>
                </div>
                <Button
                variant="outline-info"
                size="sm"
                onClick={() => navigate(`/student/reports/${dashboardData.lastResult.reportId}`)}
                >
                Ver Reporte
                </Button>
            </div>
            </Alert>
        )}

        <Row>
            {/* Examen disponible */}
            <Col lg={8} className="mb-4">
            <Card className="h-100">
                <Card.Header className="bg-primary text-white">
                <Card.Title className="mb-0">
                    <i className="bi bi-clipboard-check me-2"></i>
                    Examen Disponible
                </Card.Title>
                </Card.Header>
                <Card.Body>
                {dashboardData?.availableExams?.error ? (
                    <Alert variant="warning">{dashboardData.availableExams.error}</Alert>
                ) : dashboardData?.availableExams?.exams?.length > 0 ? (
                    dashboardData.availableExams.exams.map((exam) => (
                    <div key={exam.id}>
                        <h5 className="text-primary">{exam.title}</h5>
                        <p className="text-muted mb-3">{exam.description}</p>
                        <Row className="mb-3">
                        <Col sm={6}>
                            <small className="text-muted d-block">Preguntas:</small>
                            <strong>{exam._count?.examQuestions || exam.totalQuestions || 0}</strong>
                        </Col>
                        <Col sm={6}>
                            <small className="text-muted d-block">Tiempo límite:</small>
                            <strong>{exam.timeLimit ? `${exam.timeLimit} minutos` : "Sin tiempo límite"}</strong>
                        </Col>
                        </Row>
                        <div className="d-grid">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => showConfirmModal(exam)}
                            disabled={startingExam === exam.id}
                        >
                            {startingExam === exam.id ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Iniciando...
                            </>
                            ) : (
                            <>
                                <i className="bi bi-play-circle me-2"></i>
                                Comenzar Examen
                            </>
                            )}
                        </Button>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="text-center py-4">
                    <i className="bi bi-clipboard-x display-1 text-muted"></i>
                    <h5>No hay exámenes disponibles</h5>
                    <p className="text-muted">
                        {dashboardData?.availableExams?.message || 
                        "Actualmente no hay exámenes disponibles para realizar"}
                    </p>
                    </div>
                )}
                </Card.Body>
            </Card>
            </Col>

            {/* Estadísticas personales */}
            <Col lg={4} className="mb-4">
            <Card className="h-100">
                <Card.Header>
                <Card.Title className="mb-0">Mi Rendimiento</Card.Title>
                </Card.Header>
                <Card.Body>
                {dashboardData?.myReports?.reports?.length > 0 ? (
                    <div>
                    <div className="text-center mb-3">
                        <div className="display-6 text-primary">
                        {Math.round(
                            dashboardData.myReports.reports.reduce(
                            (acc, report) => acc + (report.examResult?.percentage || 0),
                            0,
                            ) / dashboardData.myReports.reports.length,
                        )}
                        %
                        </div>
                        <small className="text-muted">Promedio General</small>
                    </div>

                    <div className="mb-3">
                        <small className="text-muted d-block">Exámenes completados</small>
                        <strong>{dashboardData.myReports.reports.length}</strong>
                    </div>

                    <div className="mb-3">
                        <small className="text-muted d-block">Último resultado</small>
                        {dashboardData.lastResult && (
                        <div>
                            <Badge bg={getPerformanceColor(dashboardData.lastResult.percentage)}>
                            {dashboardData.lastResult.percentage}% -{" "}
                            {getPerformanceText(dashboardData.lastResult.percentage)}
                            </Badge>
                        </div>
                        )}
                    </div>

                    <div className="d-grid">
                        <Button variant="outline-primary" onClick={() => navigate("/student/reports")}>
                        Ver Todos los Reportes
                        </Button>
                    </div>
                    </div>
                ) : (
                    <div className="text-center py-3">
                    <div className="text-muted mb-2">
                        <i className="bi bi-graph-up display-4"></i>
                    </div>
                    <p className="text-muted">Completa tu primer examen para ver estadísticas</p>
                    </div>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Reportes recientes */}
        <Row>
            <Col>
            <Card>
                <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0">Reportes Recientes</Card.Title>
                    <Button variant="outline-primary" size="sm" onClick={() => navigate("/student/reports")}>
                    Ver Todos
                    </Button>
                </div>
                </Card.Header>
                <Card.Body>
                {dashboardData?.myReports?.reports?.length > 0 ? (
                    <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                        <tr>
                            <th>Examen</th>
                            <th>Fecha</th>
                            <th>Puntaje</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {dashboardData.myReports.reports.slice(0, 5).map((report) => (
                            <tr key={report.id}>
                            <td className="fw-medium">{report.examResult?.exam?.title || "Examen"}</td>
                            <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                            <td>
                                <Badge bg={getPerformanceColor(report.examResult?.percentage || 0)}>
                                {report.examResult?.percentage || 0}%
                                </Badge>
                            </td>
                            <td>
                                <Badge bg="success">Completado</Badge>
                            </td>
                            <td>
                                <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/student/reports/${report.id}`)}
                                >
                                Ver Reporte
                                </Button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <div className="text-center py-4">
                    <div className="text-muted mb-3">
                        <i className="bi bi-file-earmark-text display-1"></i>
                    </div>
                    <h5>No tienes reportes aún</h5>
                    <p className="text-muted">Completa un examen para generar tu primer reporte.</p>
                    </div>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>
        {/* Modal de confirmación */}
        <Modal show={confirmModal.show} onHide={() => setConfirmModal({ show: false, exam: null })} centered>
            <Modal.Header closeButton>
            <Modal.Title>Confirmar Inicio de Examen</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            {confirmModal.exam && (
                <div>
                <h5 className="text-primary">{confirmModal.exam.title}</h5>
                <p className="text-muted">{confirmModal.exam.description}</p>

                <Alert variant="warning">
                    <h6>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Antes de comenzar, ten en cuenta:
                    </h6>
                    <ul className="mb-0">
                    <li>
                        {exams.timeLimit ? `Tienes ${exams.timeLimit} minutos para completar el examen` : "Sin tiempo límite"}
                    </li>
                    <li>
                        El examen contiene <strong>{confirmModal.exam.totalQuestions} preguntas</strong>
                    </li>
                    <li>No podrás pausar el examen una vez iniciado</li>
                    <li>Asegúrate de tener una conexión estable a internet</li>
                    <li>Evita cerrar la ventana del navegador</li>
                    </ul>
                </Alert>

                <div className="text-center">
                    <p className="mb-0">
                    <strong>¿Estás listo para comenzar?</strong>
                    </p>
                </div>
                </div>
            )}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={() => setConfirmModal({ show: false, exam: null })}>
                Cancelar
            </Button>
            <Button variant="success" onClick={() => handleStartExam(confirmModal.exam)} disabled={startingExam !== null}>
                {startingExam ? (
                <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Iniciando...
                </>
                ) : (
                "Sí, Comenzar Examen"
                )}
            </Button>
            </Modal.Footer>
        </Modal>
        </div>
    )
}

export default StudentDashboard