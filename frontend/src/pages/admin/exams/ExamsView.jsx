import { useState, useEffect } from "react"
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, Tab, Tabs } from "react-bootstrap"
import { useParams, Link, useNavigate } from "react-router-dom"
import { examService } from "../../../services/examService"

const ExamsView = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [exam, setExam] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeTab, setActiveTab] = useState("details")
    const [deleteModal, setDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { loadExam() }, [id])

    const loadExam = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await examService.getExamById(id)
            setExam(data)
        } catch (err) {
            console.error("Error al cargar el examen:", err)
            setError("Error al cargar el examen. Intente nuevamente.")
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        try {
            await examService.toggleExamStatus(id)
            loadExam()
        } catch (err) {
            console.error("Error al cambiar el estado del examen:", err)
            setError("Error al cambiar el estado del examen")
        }
    }

    const handleDuplicate = async () => {
        try {
            await examService.duplicateExam(id)
            navigate("/admin/exams", {
                state: { message: "Examen duplicado exitosamente" }
            })
        } catch (err) {
            console.error("Error al duplicar el examen:", err)
            setError("Error al duplicar el examen")
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            await examService.deleteExam(id)
            navigate("/admin/exams", {
                state: { message: "Examen eliminado exitosamente" }
            })
        } catch (err) {
            console.error("Error eliminando examen:", err)
            setError("Error eliminando examen. Intente nuevamente.")
        } finally {
            setDeleting(false)
            setDeleteModal(false)
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

    const getStatusBadge = (status) => {
        const variant = {
            active: "success",
            draft: "warning",
            inactive: "secondary",
            archived: "danger"
        }[status] || "secondary"
        
        const text = {
            active: "Activo",
            draft: "Borrador",
            inactive: "Inactivo",
            archived: "Archivado"
        }[status] || status

        return <Badge bg={variant}>{text}</Badge>
    }

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
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
                        <Button variant="outline-danger" onClick={loadExam}>
                            Reintentar
                        </Button>
                        <Button variant="secondary" onClick={() => navigate("/admin/exams")}>
                            Volver a Lista
                        </Button>
                    </div>
                </Alert>
            </Container>
        )
    }

    if (!exam) {
        return (
            <Container>
                <Alert variant="warning">
                    <Alert.Heading>Examen no encontrado</Alert.Heading>
                    <p>El examen que buscas no existe o ha sido eliminado.</p>
                    <Button variant="outline-warning" onClick={() => navigate("/admin/exams")}>
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
                    <h1 className="mb-1">{exam.title}</h1>
                    <div className="d-flex align-items-center gap-2">
                        {getStatusBadge(exam.status)}
                        <Badge bg="info">{exam.subject || "Sin materia"}</Badge>
                    </div>
                    <p className="text-muted mt-2 mb-0">{exam.description}</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="primary" onClick={() => navigate(`/admin/exams/edit/${id}`)}>
                        Editar
                    </Button>
                    <Button variant="outline-success" onClick={() => navigate(`/admin/exams/${id}/results`)}>
                        Ver Resultados
                    </Button>
                    <Button 
                        variant={exam.status === "active" ? "warning" : "success"} 
                        onClick={handleToggleStatus}
                    >
                        {exam.status === "active" ? "Desactivar" : "Activar"}
                    </Button>
                    <Button variant="outline-primary" onClick={handleDuplicate}>
                        Duplicar
                    </Button>
                    <Button variant="outline-danger" onClick={() => setDeleteModal(true)}>
                        Eliminar
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="details" title="Detalles">
                    <Row className="mt-3">
                        <Col lg={8}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Información General</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <strong className="text-muted d-block">Duración</strong>
                                                <span>{exam.timeLimit ? `${exam.timeLimit} minutos` : "Sin límite de tiempo"}</span>
                                            </div>
                                            <div className="mb-3">
                                                <strong className="text-muted d-block">Puntaje Mínimo</strong>
                                                <span>{exam.passingScore || "No especificado"}</span>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <strong className="text-muted d-block">Intentos Máximos</strong>
                                                <span>{exam.maxAttempts || "No especificado"}</span>
                                            </div>
                                            <div className="mb-3">
                                                <strong className="text-muted d-block">Total de Preguntas</strong>
                                                <span>{exam.questions?.length || exam.questionCount || 0}</span>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Instrucciones</h5>
                                </Card.Header>
                                <Card.Body>
                                    {exam.instructions ? (
                                        <div style={{ whiteSpace: "pre-wrap" }}>{exam.instructions}</div>
                                    ) : (
                                        <p className="text-muted">No hay instrucciones específicas</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Información del Sistema</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <strong className="text-muted d-block">ID del Examen</strong>
                                        <code>{exam.id}</code>
                                    </div>
                                    <div className="mb-3">
                                        <strong className="text-muted d-block">Fecha de Creación</strong>
                                        <span>{formatDate(exam.createdAt)}</span>
                                    </div>
                                    <div className="mb-3">
                                        <strong className="text-muted d-block">Última Modificación</strong>
                                        <span>{formatDate(exam.updatedAt)}</span>
                                    </div>
                                    <div className="mb-3">
                                        <strong className="text-muted d-block">Tipo de Selección</strong>
                                        <span>{exam.questionSelectionType === "manual" ? "Manual" : "Automática"}</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                <Tab eventKey="questions" title={`Preguntas (${exam.questions?.length || exam.questionCount || 0})`}>
                    <Card className="mt-3">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Preguntas del Examen</h5>
                                <Badge bg="primary">
                                    {exam.questions?.length || exam.questionCount || 0} preguntas
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {exam.questions && exam.questions.length > 0 ? (
                                <div className="list-group">
                                    {exam.questions.map((question, index) => (
                                        <div key={question.id} className="list-group-item mb-2">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="mb-1">
                                                    {index + 1}. {question.question}
                                                </h6>
                                                <div className="d-flex gap-2">
                                                    <Badge bg={
                                                        question.difficulty === "easy" ? "success" : 
                                                        question.difficulty === "medium" ? "warning" : "danger"
                                                    }>
                                                        {question.difficulty}
                                                    </Badge>
                                                    <Badge bg="info">{question.type}</Badge>
                                                </div>
                                            </div>

                                            {question.type === "multiple_choice" && question.options && (
                                                <div className="mt-2">
                                                    <p className="text-muted small mb-1">Opciones:</p>
                                                    <div className="row g-2">
                                                        {question.options.map((option, optionIndex) => (
                                                            <div key={optionIndex} className="col-md-6">
                                                                <div className={`p-2 rounded ${
                                                                    option.isCorrect ? "bg-success bg-opacity-10" : "bg-light"
                                                                }`}>
                                                                    <span className={`me-2 ${
                                                                        option.isCorrect ? "text-success fw-bold" : "text-muted"
                                                                    }`}>
                                                                        {String.fromCharCode(65 + optionIndex)}.
                                                                    </span>
                                                                    {option.text}
                                                                    {option.isCorrect && (
                                                                        <span className="ms-2 text-success">✓</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {question.explanation && (
                                                <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                                                    <p className="small mb-0">
                                                        <strong>Explicación:</strong> {question.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Alert variant="info" className="text-center">
                                    {exam.questionSelectionType === "automatic" ? 
                                        `Este examen selecciona automáticamente ${exam.questionCount} preguntas` : 
                                        "No hay preguntas configuradas para este examen"}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="settings" title="Configuración">
                    <Row className="mt-3">
                        <Col md={6}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Configuración de Preguntas</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <strong className="text-muted d-block">Tipo de Selección</strong>
                                        <p>{exam.questionSelectionType === "manual" ? "Manual" : "Automática"}</p>
                                    </div>

                                    {exam.questionSelectionType === "automatic" && (
                                        <>
                                            <div className="mb-3">
                                                <strong className="text-muted d-block">Número de Preguntas</strong>
                                                <p>{exam.questionCount}</p>
                                            </div>
                                            <div>
                                                <strong className="text-muted d-block">Distribución de Dificultad</strong>
                                                <div className="mt-2">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Fácil:</span>
                                                        <span>{exam.difficultyDistribution?.easy || 0}%</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Medio:</span>
                                                        <span>{exam.difficultyDistribution?.medium || 0}%</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span>Difícil:</span>
                                                        <span>{exam.difficultyDistribution?.hard || 0}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Opciones Avanzadas</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-3">
                                        <span>Aleatorizar preguntas:</span>
                                        <Badge bg={exam.randomizeQuestions ? "success" : "secondary"}>
                                            {exam.randomizeQuestions ? "Sí" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3">
                                        <span>Mostrar resultados inmediatamente:</span>
                                        <Badge bg={exam.showResultsImmediately ? "success" : "secondary"}>
                                            {exam.showResultsImmediately ? "Sí" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Permitir revisar respuestas:</span>
                                        <Badge bg={exam.allowReview ? "success" : "secondary"}>
                                            {exam.allowReview ? "Sí" : "No"}
                                        </Badge>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
            </Tabs>

            {/* Modal de confirmación de eliminación */}
            <Modal show={deleteModal} onHide={() => setDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Estás seguro de que deseas eliminar este examen?</p>
                    <div className="bg-light p-3 rounded mb-3">
                        <strong>Examen:</strong> {exam.title}
                        <div className="small text-muted">
                            {exam.questions?.length || exam.questionCount || 0} preguntas • Creado el {formatDate(exam.createdAt)}
                        </div>
                    </div>
                    <Alert variant="warning" className="mb-0">
                        <small>
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Esta acción no se puede deshacer. Todos los resultados asociados también serán eliminados.
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

export default ExamsView