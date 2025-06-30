import { useState, useEffect } from "react"
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, Modal } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { examService } from "../../../services/examService"

const ExamAvailable = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [startingExam, setStartingExam] = useState(null)
    const [confirmModal, setConfirmModal] = useState({ show: false, exam: null })

    useEffect(() => {loadAvailableExams()}, [])

    const loadAvailableExams = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await examService.getAvailableExams()
            setExams(data.exams || [])
        } catch (error) {
            console.error("Error cargando exámenes:", error)
            setError("Error cargando exámenes disponibles")
        } finally {
            setLoading(false)
        }
    }

    const handleStartExam = async (exam) => {
        try {
            setStartingExam(exam.id)
            setError("")

            const result = await examService.startExam(exam.id)

            // Redirigir al examen
            navigate(`/student/exam/${exam.id}`, {
                state: { examSession: result.session },
            })
        } catch (error) {
            console.error("Error iniciando examen:", error)
            if (error.response?.status === 409) {
                setError("Ya tienes un examen en progreso. Complétalo antes de iniciar otro.")
            } else {
                setError("Error iniciando examen. Intenta nuevamente.")
            }
        } finally {
            setStartingExam(null)
            setConfirmModal({ show: false, exam: null })
        }
    }

    const showConfirmModal = (exam) => {
        setConfirmModal({ show: true, exam })
    }

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} min`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case "fácil":
            case "easy":
                return "success"
            case "medio":
            case "medium":
                return "warning"
            case "difícil":
            case "hard":
                return "danger"
            default:
                return "secondary"
        }
    }

    if (loading) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                </div>
            </Container>
        )
    }

    return (
        <Container>
        <div className="mb-4">
            <h1 className="display-6">Exámenes Disponibles</h1>
            <p className="text-muted">Selecciona un examen para comenzar tu evaluación</p>
        </div>

        {error && (
            <Alert variant="danger" className="mb-4">
            {error}
            </Alert>
        )}

        {exams.length === 0 ? (
            <Card>
            <Card.Body className="text-center py-5">
                <div className="text-muted mb-3">
                <i className="bi bi-clipboard-x display-1"></i>
                </div>
                <h4>No hay exámenes disponibles</h4>
                <p className="text-muted">
                No tienes exámenes pendientes en este momento. Vuelve más tarde o contacta a tu instructor.
                </p>
                <Button variant="outline-primary" onClick={() => navigate("/student/dashboard")}>
                Volver al Dashboard
                </Button>
            </Card.Body>
            </Card>
        ) : (
            <Row>
            {exams.map((exam) => (
                <Col key={exam.id} lg={6} className="mb-4">
                <Card className="h-100 shadow-sm">
                    <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{exam.title}</h5>
                        <Badge bg="light" text="dark">
                        {exam.totalQuestions} preguntas
                        </Badge>
                    </div>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                    <p className="text-muted mb-3">{exam.description}</p>

                    <div className="mb-3">
                        <Row>
                        <Col sm={6}>
                            <small className="text-muted d-block">Duración:</small>
                            <strong className="text-primary">
                            <i className="bi bi-clock me-1"></i>
                            {formatDuration(exam.timeLimit)}
                            </strong>
                        </Col>
                        <Col sm={6}>
                            <small className="text-muted d-block">Dificultad:</small>
                            <Badge bg={getDifficultyColor(exam.difficulty)}>{exam.difficulty || "Estándar"}</Badge>
                        </Col>
                        </Row>
                    </div>

                    <div className="mb-3">
                        <Row>
                        <Col sm={6}>
                            <small className="text-muted d-block">Preguntas:</small>
                            <strong>{exam.totalQuestions}</strong>
                        </Col>
                        <Col sm={6}>
                            <small className="text-muted d-block">Puntaje mínimo:</small>
                            <strong>{exam.passingScore || 60}%</strong>
                        </Col>
                        </Row>
                    </div>

                    {exam.instructions && (
                        <div className="mb-3">
                        <small className="text-muted d-block">Instrucciones:</small>
                        <div className="bg-light p-2 rounded">
                            <small>{exam.instructions}</small>
                        </div>
                        </div>
                    )}

                    <div className="mt-auto">
                        <Alert variant="info" className="mb-3">
                        <small>
                            <i className="bi bi-info-circle me-1"></i>
                            <strong>Importante:</strong> Una vez iniciado, el examen debe completarse en una sola sesión.
                            Asegúrate de tener tiempo suficiente.
                        </small>
                        </Alert>

                        <div className="d-grid">
                        <Button
                            variant="success"
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
                    </Card.Body>
                    <Card.Footer className="text-muted">
                    <small>
                        <i className="bi bi-calendar me-1"></i>
                        Disponible hasta:{" "}
                        {new Date(exam.availableUntil || Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </small>
                    </Card.Footer>
                </Card>
                </Col>
            ))}
            </Row>
        )}

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
                        Tienes <strong>{formatDuration(confirmModal.exam.timeLimit)}</strong> para completar el examen
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
        </Container>
    )
    }

export default ExamAvailable