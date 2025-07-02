import { useState, useEffect } from "react"
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, Modal, ListGroup } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import { questionService } from "../../../services/questionService"

const QuestionsView = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [question, setQuestion] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deleteModal, setDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Estados para estadísticas adicionales
    const [stats, setStats] = useState({
        timesUsed: 0,
        correctRate: 0,
        lastUsed: null,
    })

    useEffect(() => {loadQuestion()}, [id])

    const loadQuestion = async () => {
        try {
            setQuestion(null);
            setLoading(true)
            setError("")

            if (!id || typeof id !== 'string') {
                throw new Error("Identificador de pregunta inválido");
            }

            const result = await questionService.getById(id);
            
            if (!result || !result.question) {
                throw new Error("La pregunta no pudo ser cargada");
            }

            setQuestion(result.question);
            setStats(result.stats || {
                timesUsed: 0,
                correctRate: 0,
                lastUsed: null
            });
        } catch (error) {
            console.error("Error en loadQuestion:", {
                id,
                error: error.message,
                stack: error.stack
            });
            const errorMessage = error.message.includes("no encontrada") 
                ? `Pregunta con ID ${id} no encontrada`
                : "Error cargando los detalles de la pregunta";
        
            setError(errorMessage);
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            await questionService.delete(id)
            navigate("/admin/questions", {
                state: { message: "Pregunta eliminada exitosamente" },
            })
        } catch (error) {
            console.error("Error eliminando pregunta:", error)
            setError("Error eliminando pregunta. Intenta nuevamente.")
            setDeleteModal(false)
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return "No especificado"
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getAlternativeLetter = (index) => {
        return String.fromCharCode(65 + index) // A, B, C, D...
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

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <div className="d-flex gap-2">
                    <Button variant="outline-danger" onClick={loadQuestion}>
                    Reintentar
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/admin/questions")}>
                    Volver a Lista
                    </Button>
                </div>
                </Alert>
            </Container>
        )
    }

    if (!question) {
        return (
            <Container>
                <Alert variant="warning">
                <Alert.Heading>Pregunta no encontrada</Alert.Heading>
                <p>La pregunta que buscas no existe o ha sido eliminada.</p>
                <Button variant="outline-warning" onClick={() => navigate("/admin/questions")}>
                    Volver a Lista
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        {/* Header con acciones */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h1 className="mb-1">Pregunta #{question.id}</h1>
            <div className="d-flex align-items-center gap-2">
                <Badge bg={question.isActive ? "success" : "secondary"}>{question.isActive ? "Activa" : "Inactiva"}</Badge>
                <Badge bg="info">{question.educationalIndicator}</Badge>
            </div>
            </div>
            <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate(`/admin/questions/edit/${id}`)}>
                Editar
            </Button>
            <Button variant="outline-danger" onClick={() => setDeleteModal(true)}>
                Eliminar
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/questions")}>
                Volver a Lista
            </Button>
            </div>
        </div>

        <Row>
            {/* Pregunta principal */}
            <Col lg={8} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">Pregunta</h5>
                </Card.Header>
                <Card.Body>
                <div className="mb-4">
                    <div className="bg-light p-4 rounded">
                    <h6 className="text-primary mb-3">Enunciado:</h6>
                    <p className="fs-5 mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {question.header}
                    </p>
                    </div>
                </div>

                <h6 className="text-primary mb-3">Alternativas:</h6>
                <ListGroup>
                    {question.alternatives?.map((alternative, index) => (
                    <ListGroup.Item
                        key={index}
                        className={`d-flex align-items-center ${
                        index === question.correctAnswer ? "list-group-item-success" : ""
                        }`}
                    >
                        <div className="me-3">
                        <Badge
                            bg={index === question.correctAnswer ? "success" : "secondary"}
                            className="rounded-circle"
                            style={{
                            width: "30px",
                            height: "30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            }}
                        >
                            {getAlternativeLetter(index)}
                        </Badge>
                        </div>
                        <div className="flex-grow-1">
                        <span className={index === question.correctAnswer ? "fw-bold" : ""}>{alternative}</span>
                        {index === question.correctAnswer && (
                            <Badge bg="success" className="ms-2">
                            Respuesta Correcta
                            </Badge>
                        )}
                        </div>
                    </ListGroup.Item>
                    ))}
                </ListGroup>
                </Card.Body>
            </Card>
            </Col>

            {/* Información adicional */}
            <Col lg={4} className="mb-4">
            <Card className="mb-3">
                <Card.Header>
                <h6 className="mb-0">Información del Profesor</h6>
                </Card.Header>
                <Card.Body>
                <div className="mb-2">
                    <strong className="text-muted d-block">Nombre:</strong>
                    <span>{question.professor?.name || "No especificado"}</span>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Materia:</strong>
                    <Badge bg="info">{question.professor?.subject || "No especificado"}</Badge>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Email:</strong>
                    <small>
                    {question.professor?.email ? (
                        <a href={`mailto:${question.professor.email}`} className="text-decoration-none">
                        {question.professor.email}
                        </a>
                    ) : (
                        "No especificado"
                    )}
                    </small>
                </div>
                </Card.Body>
            </Card>

            <Card className="mb-3">
                <Card.Header>
                <h6 className="mb-0">Detalles de la Pregunta</h6>
                </Card.Header>
                <Card.Body>
                <div className="mb-2">
                    <strong className="text-muted d-block">Indicador Educativo:</strong>
                    <Badge bg="info" className="text-wrap">
                    {question.educationalIndicator}
                    </Badge>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Total de alternativas:</strong>
                    <span>{question.alternatives?.length || 0}</span>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Respuesta correcta:</strong>
                    <Badge bg="success">
                    Opción {getAlternativeLetter(question.correctAnswer)} -{" "}
                    {question.alternatives?.[question.correctAnswer]}
                    </Badge>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Estado:</strong>
                    <Badge bg={question.isActive ? "success" : "secondary"}>
                    {question.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                </div>
                </Card.Body>
            </Card>

            <Card className="mb-3">
                <Card.Header>
                <h6 className="mb-0">Estadísticas de Uso</h6>
                </Card.Header>
                <Card.Body>
                <div className="mb-2">
                    <strong className="text-muted d-block">Veces utilizada:</strong>
                    <Badge bg="primary">{stats.timesUsed}</Badge>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Tasa de acierto:</strong>
                    <Badge bg={stats.correctRate >= 70 ? "success" : stats.correctRate >= 50 ? "warning" : "danger"}>
                    {stats.correctRate}%
                    </Badge>
                </div>
                <div className="mb-2">
                    <strong className="text-muted d-block">Último uso:</strong>
                    <small className="text-muted">{formatDate(stats.lastUsed)}</small>
                </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                <h6 className="mb-0">Acciones Rápidas</h6>
                </Card.Header>
                <Card.Body>
                <div className="d-grid gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => navigate(`/admin/questions/edit/${id}`)}>
                    Editar Pregunta
                    </Button>
                    <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => navigate(`/admin/questions/create?professor=${question.professorId}`)}
                    >
                    Crear Pregunta Similar
                    </Button>
                    <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => navigate(`/admin/professors/${question.professorId}`)}
                    >
                    Ver Profesor
                    </Button>
                </div>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Información del sistema */}
        <Row>
            <Col>
            <Card>
                <Card.Header>
                <h6 className="mb-0">Información del Sistema</h6>
                </Card.Header>
                <Card.Body>
                <Row>
                    <Col md={4}>
                    <strong className="text-muted d-block">ID de la pregunta:</strong>
                    <code>{question.id}</code>
                    </Col>
                    <Col md={4}>
                    <strong className="text-muted d-block">Fecha de creación:</strong>
                    <span>{formatDate(question.createdAt)}</span>
                    </Col>
                    <Col md={4}>
                    <strong className="text-muted d-block">Última actualización:</strong>
                    <span>{formatDate(question.updatedAt)}</span>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Modal de confirmación de eliminación */}
        <Modal show={deleteModal} onHide={() => setDeleteModal(false)}>
            <Modal.Header closeButton>
            <Modal.Title>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <p>¿Estás seguro de que deseas eliminar esta pregunta?</p>
            <div className="bg-light p-3 rounded mb-3">
                <strong>Pregunta:</strong> {question.header.substring(0, 100)}
                {question.header.length > 100 && "..."}
            </div>
            <Alert variant="warning" className="mb-0">
                <small>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Esta acción no se puede deshacer. La pregunta será eliminada permanentemente y no podrá ser utilizada en
                futuros exámenes.
                </small>
            </Alert>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={() => setDeleteModal(false)} disabled={deleting}>
                Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Eliminando...
                </>
                ) : (
                "Eliminar"
                )}
            </Button>
            </Modal.Footer>
        </Modal>
        </Container>
    )
}

export default QuestionsView