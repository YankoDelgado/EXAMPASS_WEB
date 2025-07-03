import { useState, useEffect, useCallback } from "react"
import { Container, Card, Button, Alert, Row, Col, ProgressBar, Badge, Modal, Form, Spinner } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import { examService } from "../../../services/examService"

const ExamTaking = () => {
    const navigate = useNavigate();
    const { examId } = useParams();

    //Estados principales
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [examResultId, setExamResultId] = useState(null);

    //Estado del examen
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);

    //Modales
    const [submitModal, setSubmitModal] = useState(false);
    const [timeWarningModal, setTimeWarningModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Cargar o iniciar examen
    useEffect(() => {
        const initializeExam = async () => {
            try {
                setLoading(true);
                
                // Primero intentar recuperar sesión existente
                const sessionResponse = await examService.getExamSession(examId);
                
                if (sessionResponse.success) {
                    setExamData(sessionResponse.session);
                    setAnswers(sessionResponse.session.answers);
                    setExamResultId(sessionResponse.session.id);

                    // Solo establecer tiempo si el examen tiene límite
                    if (sessionResponse.session.exam.timeLimit) {
                        setTimeRemaining(sessionResponse.session.timeRemaining);
                    }
                    return;
                }
                
                // Si no hay sesión, iniciar una nueva
                const startResponse = await examService.startExam(examId);
                
                if (!startResponse.success) {
                    throw new Error(startResponse.error);
                }
                
                // Obtener detalles completos de la nueva sesión
                const newSessionResponse = await examService.getExamSession(examId);
                
                if (!newSessionResponse.success) {
                    throw new Error(newSessionResponse.error);
                }
                
                setExamData(newSessionResponse.session);
                setAnswers(newSessionResponse.session.answers || {});
                setTimeRemaining(newSessionResponse.session.timeRemaining);
                setExamResultId(newSessionResponse.session.id);
                
            } catch (err) {
                console.error("Error inicializando examen:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initializeExam();
    }, [examId]);

    

    // Timer del examen
    useEffect(() => {
        if (examData?.exam?.timeLimit && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    const newTime = prev - 1;

                    // Advertencia cuando quedan 5 minutos
                    if (newTime === 300 && !timeWarningModal) {
                        setTimeWarningModal(true);
                    }

                    // Auto-envío cuando se acaba el tiempo
                    if (newTime <= 0) {
                        handleAutoSubmit();
                        return 0;
                    }

                    return newTime;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [timeRemaining, timeWarningModal, handleAutoSubmit, examData]);

    // Prevenir salida accidental
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = "¿Estás seguro de que quieres salir? Se perderá tu progreso del examen."
            return e.returnValue
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [])

    const handleAnswerChange = async (questionId, answerIndex) => {
        
        try {
            const newAnswers = { ...answers, [questionId]: answerIndex }
            setAnswers(newAnswers)

            await examService.saveAnswer(examResultId, questionId, answerIndex)
        } catch (error) {
            console.error("Error guardando respuesta:", error);
            setError("Error al guardar tu respuesta. Intenta nuevamente.");
        }
    }

    const handleNextQuestion = () => {
        if (examData && currentQuestionIndex < examData.exam.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    }

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    }

    const handleQuestionNavigation = (index) => {
        setCurrentQuestionIndex(index)
    }

    const handleSubmitExam = async () => {
        try {
            setSubmitting(true)
            const result = await examService.submitExam(examResultId)

            // Redirigir al resultado
            navigate(`/student/exam/${examId}/result`, {
                state: { examResult: result.examResult },
                replace: true,
            })
        } catch (error) {
            console.error("Error enviando examen:", error)
            setError("Error enviando examen. Intenta nuevamente.")
        } finally {
            setSubmitting(false)
            setSubmitModal(false)
        }
    }

    const handleAutoSubmit = useCallback(async () => {
        if (examData?.exam?.timeLimit) {
            try {
                const result = await examService.submitExam(examResultId);
                navigate(`/student/exam/${examId}/result`, {
                    state: {
                        examResult: result.examResult,
                        autoSubmitted: true,
                    },
                    replace: true,
                });
            } catch (error) {
                console.error("Error en auto-envío:", error);
                setError("El tiempo se agotó y hubo un error enviando el examen.");
            }
        }
    }, [examId, navigate, examResultId, examData])

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`
    }

    const getTimeColor = () => {
        if (!examData?.exam?.timeLimit) return "secondary";
        if (timeRemaining > 600) return "success" // > 10 min
        if (timeRemaining > 300) return "warning" // > 5 min
        return "danger" // < 5 min
    }

    const getProgressPercentage = () => {
        const answered = Object.keys(answers).length;
        const total = examData?.exam?.questions?.length || 1;
        return (answered / total) * 100;
    }

    const currentQuestion = examData?.exam?.questions?.[currentQuestionIndex]

    if (loading) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando examen...</span>
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
                <Button variant="outline-danger" onClick={() => navigate("/student/exam")}>
                    Volver a Exámenes
                </Button>
                </Alert>
            </Container>
        )
    }

    if (!examData || !examData.exam?.questions?.[currentQuestionIndex]) {
        return (
            <Container>
                <Alert variant="warning">
                <Alert.Heading>Examen no encontrado</Alert.Heading>
                <p>No se pudo cargar el examen. Verifica que tengas una sesión activa.</p>
                <Button variant="outline-warning" onClick={() => navigate("/student/exam")}>
                    Volver a Exámenes
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container fluid>
        {/* Header fijo con información del examen */}
        <div className="bg-primary text-white p-3 mb-4 sticky-top">
            <Row className="align-items-center">
            <Col md={4}>
                <h5 className="mb-0">{examData.exam.title}</h5>
                <small>
                Pregunta {currentQuestionIndex + 1} de {examData.exam.questions.length}
                </small>
            </Col>
            <Col md={4} className="text-center">
                <div className="mb-1">
                    {examData?.exam?.timeLimit && (
                        <Badge bg={getTimeColor()} className="fs-6">
                            <i className="bi bi-clock me-1"></i>
                            {formatTime(timeRemaining)}
                        </Badge>
                    )}
                </div>
                <ProgressBar
                now={getProgressPercentage()}
                variant="light"
                style={{ height: "8px" }}
                className="bg-primary"
                />
                <small>
                {Object.keys(answers).length} de {examData.exam.questions.length} respondidas
                </small>
            </Col>
            <Col md={4} className="text-end">
                <Button variant="warning" onClick={() => setSubmitModal(true)} disabled={submitting}>
                <i className="bi bi-send me-1"></i>
                {submitting ? "Enviando..." : "Enviar Examen"}
                </Button>
                {submitting && (
                <div className="mt-1">
                    <small>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Guardando...
                    </small>
                </div>
                )}
            </Col>
            </Row>
        </div>

        <Row>
            {/* Navegación de preguntas */}
            <Col lg={3} className="mb-4">
            <Card>
                <Card.Header>
                <h6 className="mb-0">Navegación</h6>
                </Card.Header>
                <Card.Body>
                <div className="d-grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                    {examData.exam.questions.map((_, index) => (
                    <Button
                        key={index}
                        variant={
                        index === currentQuestionIndex
                            ? "primary"
                            : answers[examData.exam.questions[index].id] !== undefined
                            ? "success"
                            : "outline-secondary"
                        }
                        size="sm"
                        onClick={() => handleQuestionNavigation(index)}
                    >
                        {index + 1}
                    </Button>
                    ))}
                </div>
                <div className="mt-3">
                    <div className="d-flex align-items-center mb-1">
                    <div className="bg-success rounded me-2" style={{ width: "12px", height: "12px" }}></div>
                    <small>Respondida</small>
                    </div>
                    <div className="d-flex align-items-center mb-1">
                    <div className="bg-primary rounded me-2" style={{ width: "12px", height: "12px" }}></div>
                    <small>Actual</small>
                    </div>
                    <div className="d-flex align-items-center">
                    <div className="border rounded me-2" style={{ width: "12px", height: "12px" }}></div>
                    <small>Sin responder</small>
                    </div>
                </div>
                </Card.Body>
            </Card>
            </Col>

            {/* Pregunta actual */}
            <Col lg={9}>
            <Card>
                <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Pregunta {currentQuestionIndex + 1}</h6>
                    <Badge bg="info">{currentQuestion.educationalIndicator}</Badge>
                </div>
                </Card.Header>
                <Card.Body>
                <div className="mb-4">
                    <h5 className="text-primary">{currentQuestion.header}</h5>
                </div>

                <Form>
                    {currentQuestion.alternatives?.map((alternative, index) => (
                    <Form.Check
                        key={index}
                        type="radio"
                        id={`question-${currentQuestion.id}-option-${index}`}
                        name={`question-${currentQuestion.id}`}
                        value={index}
                        checked={answers[currentQuestion.id] === index}
                        onChange={() => handleAnswerChange(currentQuestion.id, index)}
                        label={
                        <div className="d-flex align-items-center">
                            <Badge
                            bg="secondary"
                            className="me-3 rounded-circle"
                            style={{
                                width: "25px",
                                height: "25px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            >
                            {String.fromCharCode(65 + index)}
                            </Badge>
                            <span>{alternative}</span>
                        </div>
                        }
                        className="mb-3 p-3 border rounded"
                        style={{
                        backgroundColor: answers[currentQuestion.id] === index ? "#e3f2fd" : "transparent",
                        }}
                    />
                    ))}
                </Form>
                </Card.Body>
                <Card.Footer>
                <div className="d-flex justify-content-between">
                    <Button
                    variant="outline-secondary"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    >
                    <i className="bi bi-arrow-left me-1"></i>
                    Anterior
                    </Button>

                    <div className="d-flex gap-2">
                    {currentQuestionIndex === examData.exam.questions.length - 1 ? (
                        <Button variant="success" onClick={() => setSubmitModal(true)}>
                        <i className="bi bi-send me-1"></i>
                        Enviar Examen
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleNextQuestion}>
                        Siguiente
                        <i className="bi bi-arrow-right ms-1"></i>
                        </Button>
                    )}
                    </div>
                </div>
                </Card.Footer>
            </Card>
            </Col>
        </Row>

        {/* Modal de envío */}
        <Modal show={submitModal} onHide={() => setSubmitModal(false)} centered>
            <Modal.Header closeButton>
            <Modal.Title>Enviar Examen</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <div className="text-center mb-3">
                <i className="bi bi-question-circle display-1 text-warning"></i>
            </div>
            <h5 className="text-center mb-3">¿Estás seguro de que quieres enviar el examen?</h5>

            <Alert variant="info">
                <div className="mb-2">
                <strong>Resumen:</strong>
                </div>
                <ul className="mb-0">
                <li>
                    Preguntas respondidas: {Object.keys(answers).length} de {examData.exam.questions.length}
                </li>
                <li>Tiempo restante: {formatTime(timeRemaining)}</li>
                <li>Una vez enviado, no podrás hacer cambios</li>
                </ul>
            </Alert>

            {Object.keys(answers).length < examData.exam.questions.length && (
                <Alert variant="warning">
                <small>
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Tienes preguntas sin responder. Puedes enviar el examen de todas formas.
                </small>
                </Alert>
            )}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={() => setSubmitModal(false)} disabled={submitting}>
                Continuar Examen
            </Button>
            <Button variant="success" onClick={handleSubmitExam} disabled={submitting}>
                {submitting ? (
                <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enviando...
                </>
                ) : (
                "Sí, Enviar Examen"
                )}
            </Button>
            </Modal.Footer>
        </Modal>

        {/* Modal de advertencia de tiempo */}
        {examData?.exam?.timeLimit && (
            <Modal show={timeWarningModal} onHide={() => setTimeWarningModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Advertencia de Tiempo
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <h5>¡Quedan solo 5 minutos!</h5>
                        <p className="mb-0">
                            El tiempo del examen está por agotarse. Asegúrate de revisar tus respuestas.
                        </p>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="warning" onClick={() => setTimeWarningModal(false)}>
                        Entendido
                    </Button>
                </Modal.Footer>
            </Modal>
        )}
        </Container>
    )
}

export default ExamTaking
