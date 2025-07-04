import { useState, useEffect } from "react"
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, ProgressBar } from "react-bootstrap"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { examService } from "../../../services/examService"
import { studentService } from "../../../services/studentService"

const ExamResult = () => {
    const navigate = useNavigate()
    const { examId } = useParams()
    const location = useLocation()
    const [examResult, setExamResult] = useState(location.state?.examResult || null)
    const [loading, setLoading] = useState(!examResult)
    const [error, setError] = useState("")
    const [generatingReport, setGeneratingReport] = useState(false)
    const [reportGenerated, setReportGenerated] = useState(false)

    // Estados para animaciones
    const [showScore, setShowScore] = useState(false)
    const [animatedScore, setAnimatedScore] = useState(0)

    const autoSubmitted = location.state?.autoSubmitted || false

    useEffect(() => {
        const loadResult = async () => {
            try {
                setLoading(true);
                
                // Opción 1: Usar datos del estado de navegación
                if (location.state?.examResult) {
                    setExamResult(location.state.examResult);
                    return;
                }
                
                // Opción 2: Obtener por ID si está en el estado
                if (location.state?.examResultId) {
                    const response = await examService.getExamResult(location.state.examResultId);
                    if (response.success) {
                        setExamResult(response.examResult);
                    } else {
                        throw new Error(response.error);
                    }
                    return;
                }
                
                // Opción 3: Obtener el último resultado del examen
                const response = await examService.getLatestExamResult(examId);
                if (response.success) {
                    setExamResult(response.examResult);
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                console.error("Error cargando resultado:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadResult();
    }, [examId, location.state]);

    useEffect(() => {
        if (examResult && showScore) {
            // Animar el puntaje
            const targetScore = examResult.percentage
            const duration = 2000 // 2 segundos
            const steps = 60
            const increment = targetScore / steps
            let currentScore = 0

            const timer = setInterval(() => {
                currentScore += increment
                if (currentScore >= targetScore) {
                setAnimatedScore(targetScore)
                clearInterval(timer)
                } else {
                setAnimatedScore(Math.floor(currentScore))
                }
            }, duration / steps)

            return () => clearInterval(timer)
        }
    }, [showScore, examResult])


    const getScoreColor = (percentage) => {
        if (percentage >= 90) return "success"
        if (percentage >= 80) return "info"
        if (percentage >= 70) return "warning"
        if (percentage >= 60) return "primary"
        return "danger"
    }

    const getScoreMessage = (percentage) => {
        if (percentage >= 90) return "¡Excelente trabajo!"
        if (percentage >= 80) return "¡Muy buen desempeño!"
        if (percentage >= 70) return "¡Buen trabajo!"
        if (percentage >= 60) return "Aprobado"
        return "Necesitas mejorar"
    }

    const getScoreIcon = (percentage) => {
        if (percentage >= 90) return "bi-trophy-fill"
        if (percentage >= 80) return "bi-star-fill"
        if (percentage >= 70) return "bi-check-circle-fill"
        if (percentage >= 60) return "bi-check-circle"
        return "bi-x-circle-fill"
    }

    const isPassed = (percentage) => {
        return percentage >= 60
    }

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${minutes}:${secs.toString().padStart(2, "0")}`
    }

    const handleViewReport = () => {
        if (reportGenerated) {
            navigate("/student/reports")
        } else {
        // Si el reporte no está listo, ir a la lista de reportes
            navigate("/student/reports")
        }
    }

    const handleRetakeExam = () => {
        navigate("/student/exam")
    }

    const handleBackToDashboard = () => {
        navigate("/student/dashboard")
    }

    if (loading) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando resultado...</span>
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
                    <div className="d-flex gap-2 mt-3">
                        <Button variant="primary" onClick={() => navigate(-1)}>
                            Volver atrás
                        </Button>
                        <Button variant="secondary" onClick={() => navigate("/student/dashboard")}>
                            Ir al Dashboard
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    if (!examResult) {
        return (
            <Container>
                <Alert variant="warning">
                <Alert.Heading>Resultado no encontrado</Alert.Heading>
                <p>No se pudo cargar el resultado del examen.</p>
                <Button variant="outline-warning" onClick={() => navigate("/student/dashboard")}>
                    Volver al Dashboard
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        {/* Mensaje de auto-envío */}
        {autoSubmitted && (
            <Alert variant="warning" className="mb-4">
            <div className="d-flex align-items-center">
                <i className="bi bi-clock-history me-2 fs-4"></i>
                <div>
                <strong>Examen enviado automáticamente</strong>
                <p className="mb-0">
                    El tiempo se agotó y tu examen fue enviado automáticamente con las respuestas que habías completado.
                </p>
                </div>
            </div>
            </Alert>
        )}

        {/* Resultado principal */}
        <Row className="justify-content-center">
            <Col lg={8}>
            <Card className="shadow-lg">
                <Card.Header className={`bg-${getScoreColor(examResult.percentage)} text-white text-center py-4`}>
                <h2 className="mb-0">
                    <i className={`${getScoreIcon(examResult.percentage)} me-2`}></i>
                    {examResult.exam?.title}
                </h2>
                <p className="mb-0 mt-2">Examen completado</p>
                </Card.Header>

                <Card.Body className="text-center py-5">
                {/* Puntaje animado */}
                <div className="mb-4">
                    <div className="display-1 fw-bold text-primary mb-2">{`${examResult.porcentage}%` || "..."}</div>
                    <h4 className={`text-${getScoreColor(examResult.percentage)}`}>
                    {showScore && getScoreMessage(examResult.percentage)}
                    </h4>
                    <Badge bg={isPassed(examResult.percentage) ? "success" : "danger"} className="fs-6 px-3 py-2">
                    {isPassed(examResult.percentage) ? "APROBADO" : "NO APROBADO"}
                    </Badge>
                </div>

                {/* Barra de progreso */}
                {showScore && (
                    <div className="mb-4">
                    <ProgressBar
                        now={animatedScore}
                        variant={getScoreColor(examResult.percentage)}
                        style={{ height: "20px" }}
                        className="mb-2"
                    />
                    <small className="text-muted">Puntaje mínimo requerido: {examResult.exam?.passingScore || 60}%</small>
                    </div>
                )}

                {/* Estadísticas */}
                <Row className="mb-4">
                    <Col md={3} className="mb-3">
                    <div className="border rounded p-3">
                        <div className="display-6 text-success fw-bold">{examResult.totalScore}</div>
                        <small className="text-muted">Respuestas Correctas</small>
                    </div>
                    </Col>
                    <Col md={3} className="mb-3">
                    <div className="border rounded p-3">
                        <div className="display-6 text-danger fw-bold">
                        {examResult.totalQuestions - examResult.totalScore}
                        </div>
                        <small className="text-muted">Respuestas Incorrectas</small>
                    </div>
                    </Col>
                    <Col md={3} className="mb-3">
                    <div className="border rounded p-3">
                        <div className="display-6 text-primary fw-bold">{examResult.totalQuestions}</div>
                        <small className="text-muted">Total Preguntas</small>
                    </div>
                    </Col>
                    <Col md={3} className="mb-3">
                    <div className="border rounded p-3">
                        <div className="display-6 text-info fw-bold">
                        {examResult.timeSpent ? formatDuration(examResult.timeSpent) : "N/A"}
                        </div>
                        <small className="text-muted">Tiempo Utilizado</small>
                    </div>
                    </Col>
                </Row>

                {/* Estado del reporte */}
                <div className="mb-4">
                    {generatingReport ? (
                    <Alert variant="info">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Generando tu reporte personalizado...
                    </Alert>
                    ) : reportGenerated ? (
                    <Alert variant="success">
                        <i className="bi bi-check-circle me-2"></i>
                        ¡Tu reporte personalizado está listo!
                    </Alert>
                    ) : (
                    <Alert variant="warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        El reporte se está generando en segundo plano
                    </Alert>
                    )}
                </div>

                {/* Acciones */}
                <div className="d-flex flex-wrap justify-content-center gap-3">
                    <Button variant="primary" size="lg" onClick={handleViewReport} className="px-4">
                    <i className="bi bi-file-text me-2"></i>
                    Ver Reporte Detallado
                    </Button>

                    <Button variant="outline-secondary" size="lg" onClick={handleBackToDashboard} className="px-4">
                    <i className="bi bi-house me-2"></i>
                    Volver al Dashboard
                    </Button>
                </div>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Información adicional */}
        <Row className="justify-content-center mt-4">
            <Col lg={8}>
            <Card>
                <Card.Header>
                <h6 className="mb-0">Detalles del Examen</h6>
                </Card.Header>
                <Card.Body>
                <Row>
                    <Col md={6}>
                    <div className="mb-2">
                        <strong className="text-muted">Examen:</strong>
                        <div>{examResult.exam?.title}</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">Descripción:</strong>
                        <div>{examResult.exam?.description || "Sin descripción"}</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">Fecha de realización:</strong>
                        <div>{new Date(examResult.completedAt).toLocaleString()}</div>
                    </div>
                    </Col>
                    <Col md={6}>
                    <div className="mb-2">
                        <strong className="text-muted">Tiempo límite:</strong>
                        <div>{examResult.timeLimit ? `${examResult.timeLimit} minutos` : "Sin tiempo límite"}</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">Estado:</strong>
                        <div>
                        <Badge bg={isPassed(examResult.percentage) ? "success" : "danger"}>
                            {isPassed(examResult.percentage) ? "Aprobado" : "No Aprobado"}
                        </Badge>
                        </div>
                    </div>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Mensaje motivacional */}
        <Row className="justify-content-center mt-4">
            <Col lg={8}>
            <Alert variant={isPassed(examResult.percentage) ? "success" : "info"} className="text-center">
                {isPassed(examResult.percentage) ? (
                <div>
                    <h5>🎉 ¡Felicitaciones!</h5>
                    <p className="mb-0">
                    Has aprobado el examen exitosamente. Tu reporte personalizado te ayudará a identificar tus fortalezas
                    y áreas de mejora para continuar tu aprendizaje.
                    </p>
                </div>
                ) : (
                <div>
                    <h5>💪 ¡No te desanimes!</h5>
                    <p className="mb-0">
                    Aunque no alcanzaste el puntaje mínimo esta vez, tu reporte personalizado te mostrará exactamente qué
                    temas necesitas reforzar. ¡Puedes intentarlo de nuevo cuando te sientas preparado!
                    </p>
                </div>
                )}
            </Alert>
            </Col>
        </Row>
        </Container>
    )
}

export default ExamResult