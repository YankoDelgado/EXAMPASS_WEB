import { useState, useEffect } from "react"
import { Container, Card, Alert, Spinner, Table, Badge } from "react-bootstrap"
import { useParams, Link, useNavigate } from "react-router-dom"
import { examService } from "../../../services/examService"

const ExamsView = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [exam, setExam] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

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

    const truncateText = (text, maxLength = 100) => {
        if (!text) return ""
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
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
                    <div className="d-flex gap-2 mt-3">
                        <Link to="/admin/exams" className="btn btn-secondary">
                            Volver a Lista
                        </Link>
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
                    <Link to="/admin/exams" className="btn btn-outline-warning mt-2">
                        Volver a Lista
                    </Link>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="mb-1">{exam.title}</h1>
                    <div className="d-flex align-items-center gap-2">
                        {getStatusBadge(exam.status)}
                    </div>
                    <p className="text-muted mt-2 mb-0">{exam.description}</p>
                </div>
                <Link to="/admin/exams" className="btn btn-outline-secondary">
                    Volver a Lista
                </Link>
            </div>

            {/* Información Básica */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Información del Examen</h5>
                </Card.Header>
                <Card.Body>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <strong className="text-muted d-block">Duración</strong>
                                <span>{exam.timeLimit ? `${exam.timeLimit} minutos` : "Sin límite de tiempo"}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <strong className="text-muted d-block">Total de Preguntas</strong>
                                <span>{exam.questions?.length || exam.questionCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <strong className="text-muted d-block">Fecha de Creación</strong>
                                <span>{formatDate(exam.createdAt)}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <strong className="text-muted d-block">Última Modificación</strong>
                                <span>{formatDate(exam.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Tabla de Preguntas */}
            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Preguntas Vinculadas</h5>
                        <Badge bg="primary" pill>
                            {exam.questions?.length || exam.questionCount || 0}
                        </Badge>
                    </div>
                </Card.Header>
                <Card.Body>
                    {exam.questions && exam.questions.length > 0 ? (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th style={{ width: "40%" }}>Pregunta</th>
                                    <th>Profesor</th>
                                    <th>Indicador</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exam.questions.map((question, index) => (
                                    <tr key={question.id}>
                                        <td>
                                            <div className="fw-medium mb-1">{truncateText(question.header, 80)}</div>
                                            <small className="text-muted">ID: {question.id}</small>
                                        </td>
                                        <td>
                                            <div className="fw-medium">{question.professor?.name}</div>
                                            <small className="text-muted">{question.professor?.subject}</small>
                                        </td>
                                        <td>
                                            <Badge bg="info" className="text-wrap">
                                                {truncateText(question.educationalIndicator, 30)}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge bg={question.isActive ? "success" : "secondary"}>
                                                {question.isActive ? "Activa" : "Inactiva"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info" className="text-center">
                            No hay preguntas vinculadas a este examen
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    )
}

export default ExamsView