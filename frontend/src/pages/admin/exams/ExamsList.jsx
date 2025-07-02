import { useState, useEffect } from "react"
import { Container, Card, Table, Button, Form, Row, Col, Badge, Spinner, Alert, Modal, InputGroup, Pagination } from "react-bootstrap"
import { useNavigate, useSearchParams } from "react-router-dom"
import { examService } from "../../../services/examService"
import { questionService } from "../../../services/questionService"

const ExamsList = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deleteModal, setDeleteModal] = useState({ show: false, exam: null })
    const [deleting, setDeleting] = useState(false)
    const [subjects, setSubjects] = useState([])

    // Filtros y búsqueda
    const [filters, setFilters] = useState({
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "",
        subject: searchParams.get("subject") || "",
        page: Number.parseInt(searchParams.get("page")) || 1,
        limit: Number.parseInt(searchParams.get("limit")) || 10,
    })

    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0,
        currentPage: 1,
    })

    useEffect(() => {
        loadExams()
        loadSubjects()
    }, [filters])

    const loadExams = async () => {
        try {
            setLoading(true)
            const data = await examService.getAllExams(filters)
            setExams(data.exams || [])
            setPagination({
                total: data.total || 0,
                pages: data.pages || 0,
                currentPage: data.currentPage || 1,
            })
        } catch (error) {
            setError("Error cargando exámenes")
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadSubjects = async () => {
        try {
            const data = await questionService.getSubjects()
            setSubjects(data.subjects || [])
        } catch (error) {
            console.error("Error cargando materias:", error)
        }
    }

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1,
        }))
    }

    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }))
    }

    const handleDeleteClick = (exam) => {
        setDeleteModal({ show: true, exam })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteModal.exam) return

        try {
            setDeleting(true)
            await examService.deleteExam(deleteModal.exam.id)
            setDeleteModal({ show: false, exam: null })
            loadExams()
        } catch (error) {
            setError("Error eliminando examen")
            console.error("Error:", error)
        } finally {
            setDeleting(false)
        }
    }

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "",
            subject: "",
            page: 1,
            limit: 10,
        })
    }

    const truncateText = (text, maxLength = 100) => {
        if (!text) return ""
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
    }

    const formatDate = (dateString) => {
        if (!dateString) return "No especificado"
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case "ACTIVE":
                return <Badge bg="success">Activo</Badge>
            case "DRAFT":
                return <Badge bg="warning">Borrador</Badge>
            case "INACTIVE":
                return <Badge bg="secondary">Inactivo</Badge>
            default:
                return <Badge bg="secondary">Desconocido</Badge>
        }
    }

    const renderPagination = () => {
        if (pagination.pages <= 1) return null

        const items = []
        const maxVisible = 5
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
        const endPage = Math.min(pagination.pages, startPage + maxVisible - 1)

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1)
        }

        // Primera página
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            )
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" />)
            }
        }

        // Páginas visibles
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item key={page} active={page === pagination.currentPage} onClick={() => handlePageChange(page)}>
                    {page}
                </Pagination.Item>
            )
        }

        // Última página
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" />)
            }
            items.push(
                <Pagination.Item key={pagination.pages} onClick={() => handlePageChange(pagination.pages)}>
                    {pagination.pages}
                </Pagination.Item>
            )
        }

        return (
            <div className="d-flex justify-content-center mt-4">
                <Pagination>
                    <Pagination.Prev
                        disabled={pagination.currentPage === 1}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                    />
                    {items}
                    <Pagination.Next
                        disabled={pagination.currentPage === pagination.pages}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                    />
                </Pagination>
            </div>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={loadExams}>
                        Reintentar
                    </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Banco de Exámenes</h1>
                <Button variant="primary" onClick={() => navigate("/admin/exams/create")}>
                    Crear Examen
                </Button>
            </div>

            {/* Filtros avanzados */}
            <Card className="mb-4">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Filtros de Búsqueda</h6>
                        <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                            Limpiar Filtros
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6} lg={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Buscar examen</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Buscar en texto..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange("search", e.target.value)}
                                    />
                                    <InputGroup.Text>
                                        <i className="bi bi-search"></i>
                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        <Col md={6} lg={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Materia</Form.Label>
                                <Form.Select
                                    value={filters.subject}
                                    onChange={(e) => handleFilterChange("subject", e.target.value)}
                                >
                                    <option value="">Todas las materias</option>
                                    {subjects.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} lg={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="ACTIVE">Activo</option>
                                    <option value="DRAFT">Borrador</option>
                                    <option value="INACTIVE">Inactivo</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} lg={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Por página</Form.Label>
                                <Form.Select
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange("limit", Number.parseInt(e.target.value))}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Tabla de exámenes */}
            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Lista de Exámenes</h5>
                        <Badge bg="secondary">{pagination.total} exámenes</Badge>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </Spinner>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="text-muted mb-3">
                                <i className="bi bi-file-earmark-text display-1"></i>
                            </div>
                            <h5>No se encontraron exámenes</h5>
                            <p className="text-muted">
                                {Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 10)
                                    ? "Intenta ajustar los filtros de búsqueda"
                                    : "Comienza creando tu primer examen"}
                            </p>
                            {!Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 10) && (
                                <Button variant="primary" onClick={() => navigate("/admin/exams/create")}>
                                    Crear Primer Examen
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: "30%" }}>Examen</th>
                                            <th>Materia</th>
                                            <th>Estado</th>
                                            <th>Preguntas</th>
                                            <th>Duración</th>
                                            <th>Creado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exams.map((exam) => (
                                            <tr key={exam.id}>
                                                <td>
                                                    <div className="fw-medium mb-1">{truncateText(exam.title, 60)}</div>
                                                    {exam.description && (
                                                        <small className="text-muted">{truncateText(exam.description, 50)}</small>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg="info">{exam.subject}</Badge>
                                                </td>
                                                <td>{getStatusBadge(exam.status)}</td>
                                                <td>
                                                    <Badge bg="primary">{exam.questionCount || exam.questions?.length || 0}</Badge>
                                                </td>
                                                <td>{exam.timeLimit || "--"} min</td>
                                                <td>
                                                    <small className="text-muted">{formatDate(exam.createdAt)}</small>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/exams/${exam.id}`)}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/exams/edit/${exam.id}`)}
                                                            title="Editar"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(exam)}
                                                            title="Eliminar"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            {renderPagination()}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Modal de confirmación de eliminación */}
            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, exam: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Estás seguro de que deseas eliminar este examen?</p>
                    <div className="bg-light p-3 rounded mb-3">
                        <strong>Examen:</strong> {truncateText(deleteModal.exam?.title, 100)}
                    </div>
                    <Alert variant="warning" className="mb-0">
                        <small>
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Esta acción no se puede deshacer. El examen será eliminado permanentemente.
                        </small>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteModal({ show: false, exam: null })}
                        disabled={deleting}
                    >
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
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

export default ExamsList
