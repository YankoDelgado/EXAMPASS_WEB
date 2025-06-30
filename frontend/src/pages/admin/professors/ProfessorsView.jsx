import { useState, useEffect } from "react"
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, Modal, Table } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import { professorService } from "../../../services/professorService"

const ProfessorsView = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [professor, setProfessor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deleteModal, setDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    //Estados para estadísticas adicionales
    const [stats, setStats] = useState({
        totalQuestions: 0,
        activeQuestions: 0,
        subjects: [],
    })

    useEffect(() => {loadProfessor()}, [id])

    const loadProfessor = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await professorService.getById(id)
            setProfessor(data.professor)

            //Si el backend devuelve estadísticas, las usamos
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (error) {
            console.error("Error cargando profesor:", error)
            if (error.response?.status === 404) {
                setError("Profesor no encontrado")
            } else {
                setError("Error cargando datos del profesor")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            await professorService.delete(id)
            navigate("/admin/professors", {
                state: { message: `Profesor ${professor.name} eliminado exitosamente` },
            })
        } catch (error) {
            console.error("Error eliminando profesor:", error)
            setError("Error eliminando profesor. Intenta nuevamente.")
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
                    <Button variant="outline-danger" onClick={loadProfessor}>
                    Reintentar
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/admin/professors")}>
                    Volver a Lista
                    </Button>
                </div>
                </Alert>
            </Container>
        )
    }

    if (!professor) {
        return (
            <Container>
                <Alert variant="warning">
                <Alert.Heading>Profesor no encontrado</Alert.Heading>
                <p>El profesor que buscas no existe o ha sido eliminado.</p>
                <Button variant="outline-warning" onClick={() => navigate("/admin/professors")}>
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
            <h1 className="mb-1">{professor.name}</h1>
            <div className="d-flex align-items-center gap-2">
                <Badge bg={professor.isActive ? "success" : "secondary"}>
                {professor.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <Badge bg="info">{professor.subject}</Badge>
            </div>
            </div>
            <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate(`/admin/professors/edit/${id}`)}>
                Editar
            </Button>
            <Button variant="outline-danger" onClick={() => setDeleteModal(true)}>
                Eliminar
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/professors")}>
                Volver a Lista
            </Button>
            </div>
        </div>

        <Row>
            {/* Información principal */}
            <Col lg={8} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">Información del Profesor</h5>
                </Card.Header>
                <Card.Body>
                <Row>
                    <Col md={6}>
                    <div className="mb-3">
                        <strong className="text-muted d-block">Nombre completo</strong>
                        <span className="fs-5">{professor.name}</span>
                    </div>

                    <div className="mb-3">
                        <strong className="text-muted d-block">Email</strong>
                        <a href={`mailto:${professor.email}`} className="text-decoration-none">
                        {professor.email}
                        </a>
                    </div>

                    <div className="mb-3">
                        <strong className="text-muted d-block">Materia</strong>
                        <Badge bg="info" className="fs-6">
                        {professor.subject}
                        </Badge>
                    </div>
                    </Col>

                    <Col md={6}>
                    <div className="mb-3">
                        <strong className="text-muted d-block">Teléfono</strong>
                        <span>{professor.phone || "No especificado"}</span>
                    </div>

                    <div className="mb-3">
                        <strong className="text-muted d-block">Estado</strong>
                        <Badge bg={professor.isActive ? "success" : "secondary"}>
                        {professor.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                    </div>

                    <div className="mb-3">
                        <strong className="text-muted d-block">Fecha de registro</strong>
                        <span>{formatDate(professor.createdAt)}</span>
                    </div>
                    </Col>
                </Row>

                {professor.bio && (
                    <div className="mt-4">
                    <strong className="text-muted d-block mb-2">Biografía</strong>
                    <div className="bg-light p-3 rounded">
                        <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {professor.bio}
                        </p>
                    </div>
                    </div>
                )}
                </Card.Body>
            </Card>
            </Col>

            {/* Estadísticas y acciones rápidas */}
            <Col lg={4} className="mb-4">
            <Card className="mb-3">
                <Card.Header>
                <h6 className="mb-0">Estadísticas</h6>
                </Card.Header>
                <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Preguntas totales</span>
                    <Badge bg="primary">{stats.totalQuestions}</Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Preguntas activas</span>
                    <Badge bg="success">{stats.activeQuestions}</Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span>Última actualización</span>
                    <small className="text-muted">{formatDate(professor.updatedAt)}</small>
                </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                <h6 className="mb-0">Acciones Rápidas</h6>
                </Card.Header>
                <Card.Body>
                <div className="d-grid gap-2">
                    <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate(`/admin/questions?professor=${id}`)}
                    >
                    Ver Preguntas
                    </Button>
                    <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => navigate(`/admin/questions/create?professor=${id}`)}
                    >
                    Crear Pregunta
                    </Button>
                    <Button variant="outline-info" size="sm" onClick={() => navigate(`/admin/professors/edit/${id}`)}>
                    Editar Profesor
                    </Button>
                </div>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Información adicional */}
        <Row>
            <Col>
            <Card>
                <Card.Header>
                <h6 className="mb-0">Historial de Actividad</h6>
                </Card.Header>
                <Card.Body>
                <Table size="sm" className="mb-0">
                    <tbody>
                    <tr>
                        <td>
                        <strong>Creado:</strong>
                        </td>
                        <td>{formatDate(professor.createdAt)}</td>
                    </tr>
                    <tr>
                        <td>
                        <strong>Última actualización:</strong>
                        </td>
                        <td>{formatDate(professor.updatedAt)}</td>
                    </tr>
                    <tr>
                        <td>
                        <strong>ID del sistema:</strong>
                        </td>
                        <td>
                        <code>{professor.id}</code>
                        </td>
                    </tr>
                    </tbody>
                </Table>
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
            <p>
                ¿Estás seguro de que deseas eliminar al profesor <strong>{professor.name}</strong>?
            </p>
            <Alert variant="warning" className="mb-0">
                <small>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Esta acción no se puede deshacer. También se eliminarán todas las preguntas asociadas a este profesor.
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

export default ProfessorsView