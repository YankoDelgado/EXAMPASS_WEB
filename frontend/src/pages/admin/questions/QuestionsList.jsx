import { useState, useEffect } from "react"
import {Container,Card,Table,Button,Form,Row,Col,Badge,Spinner,Alert,Modal,InputGroup,Pagination} from "react-bootstrap"
import { useNavigate, useSearchParams } from "react-router-dom"
import { questionService } from "../../../services/questionService"
import { professorService } from "../../../services/professorService"

const QuestionsList = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [questions, setQuestions] = useState([])
    const [professors, setProfessors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deleteModal, setDeleteModal] = useState({ show: false, question: null })
    const [deleting, setDeleting] = useState(false)

    // Filtros y búsqueda
    const [filters, setFilters] = useState({
        search: searchParams.get("search") || "",
        professor: searchParams.get("professor") || "",
        indicator: searchParams.get("indicator") || "",
        isActive: searchParams.get("isActive") || "true",
        page: Number.parseInt(searchParams.get("page")) || 1,
        limit: Number.parseInt(searchParams.get("limit")) || 10,
    })

    const [indicators, setIndicators] = useState([])
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0,
        currentPage: 1,
    })

    useEffect(() => {
        loadQuestions()
        loadProfessors()
        loadIndicators()
    }, [filters])

    const loadQuestions = async () => {
        try {
            setLoading(true)
            console.log("Enviando filtros:", filters)
            const data = await questionService.getAll(filters)
            setQuestions(data.questions || [])
            setPagination({
                total: data.total || 0,
                pages: data.pages || 0,
                currentPage: data.currentPage || 1,
            })
        } catch (error) {
            setError("Error cargando preguntas")
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadProfessors = async () => {
        try {
            const data = await professorService.getAll({ limit: 100 })
            setProfessors(data.professors || [])
        } catch (error) {
            console.error("Error cargando profesores:", error)
        }
    }

    const loadIndicators = async () => {
        try {
            const data = await questionService.getEducationalIndicators()
            setIndicators(data.indicators || [])
        } catch (error) {
            console.error("Error cargando indicadores:", error)
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

    const handleDeleteClick = (question) => {
        setDeleteModal({ show: true, question })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteModal.question) return

        try {
            setDeleting(true)
            await questionService.delete(deleteModal.question.id)
            setDeleteModal({ show: false, question: null })
            loadQuestions()
        } catch (error) {
            setError("Error eliminando pregunta")
            console.error("Error:", error)
        } finally {
            setDeleting(false)
        }
    }

    const clearFilters = () => {
        setFilters({
            search: "",
            professor: "",
            indicator: "",
            isActive: "true",
            page: 1,
            limit: 10,
        })
    }

    const truncateText = (text, maxLength = 100) => {
        if (!text) return ""
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
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
                </Pagination.Item>,
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
                </Pagination.Item>,
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
            </Pagination.Item>,
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
                <Button variant="outline-danger" onClick={loadQuestions}>
                    Reintentar
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Banco de Preguntas</h1>
            <Button variant="primary" onClick={() => navigate("/admin/questions/create")}>
            Crear Pregunta
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
                    <Form.Label>Buscar pregunta</Form.Label>
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
                    <Form.Label>Profesor</Form.Label>
                    <Form.Select
                    value={filters.professor}
                    onChange={(e) => handleFilterChange("professor", e.target.value)}
                    >
                    <option value="">Todos los profesores</option>
                    {professors.map((professor) => (
                        <option key={professor.id} value={professor.id}>
                        {professor.name} - {professor.subject}
                        </option>
                    ))}
                    </Form.Select>
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Indicador Educativo</Form.Label>
                    <Form.Select
                    value={filters.indicator}
                    onChange={(e) => handleFilterChange("indicator", e.target.value)}
                    >
                    <option value="">Todos los indicadores</option>
                    {indicators.map((indicator, index) => (
                        <option key={index} value={indicator}>
                        {indicator}
                        </option>
                    ))}
                    </Form.Select>
                </Form.Group>
                </Col>

                <Col md={6} lg={3}>
                <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select value={filters.isActive} onChange={(e) => handleFilterChange("isActive", e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="true">Activas</option>
                    <option value="false">Inactivas</option>
                    </Form.Select>
                </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6} lg={3}>
                <Form.Group>
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

        {/* Tabla de preguntas */}
        <Card>
            <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Lista de Preguntas</h5>
                <Badge bg="secondary">{pagination.total} preguntas</Badge>
            </div>
            </Card.Header>
            <Card.Body className="p-0">
            {loading ? (
                <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-5">
                <div className="text-muted mb-3">
                    <i className="bi bi-question-circle display-1"></i>
                </div>
                <h5>No se encontraron preguntas</h5>
                <p className="text-muted">
                    {Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 10)
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Comienza creando tu primera pregunta"}
                </p>
                {!Object.values(filters).some((f) => f !== "" && f !== 1 && f !== 10) && (
                    <Button variant="primary" onClick={() => navigate("/admin/questions/create")}>
                    Crear Primera Pregunta
                    </Button>
                )}
                </div>
            ) : (
                <>
                <div className="table-responsive">
                    <Table hover className="mb-0">
                    <thead className="table-light">
                        <tr>
                        <th style={{ width: "40%" }}>Pregunta</th>
                        <th>Profesor</th>
                        <th>Indicador</th>
                        <th>Alternativas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((question) => (
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
                            <Badge bg="secondary">{question.alternatives?.length || 0} opciones</Badge>
                            </td>
                            <td>
                            <Badge bg={question.isActive ? "success" : "secondary"}>
                                {question.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                            </td>
                            <td>
                            <div className="btn-group btn-group-sm">
                                <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/admin/questions/${question.id}`)}
                                title="Ver detalles"
                                >
                                <i className="bi bi-eye"></i>
                                </Button>
                                <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => navigate(`/admin/questions/edit/${question.id}`)}
                                title="Editar"
                                >
                                <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteClick(question)}
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
        <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, question: null })}>
            <Modal.Header closeButton>
            <Modal.Title>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <p>¿Estás seguro de que deseas eliminar esta pregunta?</p>
            <div className="bg-light p-3 rounded mb-3">
                <strong>Pregunta:</strong> {truncateText(deleteModal.question?.header, 100)}
            </div>
            <Alert variant="warning" className="mb-0">
                <small>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Esta acción no se puede deshacer. La pregunta será eliminada permanentemente.
                </small>
            </Alert>
            </Modal.Body>
            <Modal.Footer>
            <Button
                variant="secondary"
                onClick={() => setDeleteModal({ show: false, question: null })}
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

export default QuestionsList
