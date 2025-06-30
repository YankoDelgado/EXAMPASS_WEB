import { useState, useEffect } from "react"
import {Container,Card,Table,Button,Form,Row,Col,Badge,Spinner,Alert,Modal,InputGroup,Pagination} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { professorService } from "../../../services/professorService"

const ProfessorsList = () => {
    const navigate = useNavigate()
    const [professors, setProfessors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deleteModal, setDeleteModal] = useState({ show: false, professor: null })
    const [deleting, setDeleting] = useState(false)

    //Filtros y búsqueda
    const [filters, setFilters] = useState({
        search: "",
        subject: "",
        page: 1,
        limit: 10,
    })
    const [subjects, setSubjects] = useState([])
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0,
        currentPage: 1,
    })

    useEffect(() => {
        loadProfessors()
        loadSubjects()
    }, [filters])

    const loadProfessors = async () => {
        try {
            setLoading(true)
            const data = await professorService.getAll(filters)
            setProfessors(data.professors || [])
            setPagination({
                total: data.total || 0,
                pages: data.pages || 0,
                currentPage: data.currentPage || 1,
            })
        } catch (error) {
            setError("Error cargando profesores")
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadSubjects = async () => {
        try {
            const data = await professorService.getSubjects()
            setSubjects(data.subjects || [])
        } catch (error) {
            console.error("Error cargando materias:", error)
        }
    }

    const handleSearch = (e) => {
        setFilters((prev) => ({
            ...prev,
            search: e.target.value,
            page: 1,
        }))
    }

    const handleSubjectFilter = (e) => {
        setFilters((prev) => ({
            ...prev,
            subject: e.target.value,
            page: 1,
        }))
    }

    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }))
    }

    const handleDeleteClick = (professor) => {
        setDeleteModal({ show: true, professor })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteModal.professor) return

        try {
            setDeleting(true)
            await professorService.delete(deleteModal.professor.id)
            setDeleteModal({ show: false, professor: null })
            loadProfessors()
        } catch (error) {
            setError("Error eliminando profesor")
            console.error("Error:", error)
        } finally {
            setDeleting(false)
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

        //Primera página
        if(startPage > 1) {
        items.push(
            <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
            1
            </Pagination.Item>,
        )
        if(startPage > 2) {
            items.push(<Pagination.Ellipsis key="start-ellipsis" />)
        }
        }

        //Páginas visibles
        for(let page = startPage; page <= endPage; page++) {
        items.push(
            <Pagination.Item key={page} active={page === pagination.currentPage} onClick={() => handlePageChange(page)}>
            {page}
            </Pagination.Item>,
        )
        }

        //Última página
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
                <Button variant="outline-danger" onClick={loadProfessors}>
                    Reintentar
                </Button>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Gestión de Profesores</h1>
            <Button variant="primary" onClick={() => navigate("/admin/professors/create")}>
            Agregar Profesor
            </Button>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-4">
            <Card.Body>
            <Row>
                <Col md={6}>
                <Form.Group>
                    <Form.Label>Buscar profesor</Form.Label>
                    <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={filters.search}
                        onChange={handleSearch}
                    />
                    <InputGroup.Text>
                        <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    </InputGroup>
                </Form.Group>
                </Col>
                <Col md={4}>
                <Form.Group>
                    <Form.Label>Filtrar por materia</Form.Label>
                    <Form.Select value={filters.subject} onChange={handleSubjectFilter}>
                    <option value="">Todas las materias</option>
                    {subjects.map((subject, index) => (
                        <option key={index} value={subject}>
                        {subject}
                        </option>
                    ))}
                    </Form.Select>
                </Form.Group>
                </Col>
                <Col md={2}>
                <Form.Group>
                    <Form.Label>Por página</Form.Label>
                    <Form.Select
                    value={filters.limit}
                    onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number.parseInt(e.target.value), page: 1 }))}
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

        {/* Tabla de profesores */}
        <Card>
            <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Lista de Profesores</h5>
                <Badge bg="secondary">{pagination.total} profesores</Badge>
            </div>
            </Card.Header>
            <Card.Body className="p-0">
            {loading ? (
                <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                </div>
            ) : professors.length === 0 ? (
                <div className="text-center py-5">
                <div className="text-muted mb-3">
                    <i className="bi bi-person-x display-1"></i>
                </div>
                <h5>No se encontraron profesores</h5>
                <p className="text-muted">
                    {filters.search || filters.subject
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Comienza agregando tu primer profesor"}
                </p>
                {!filters.search && !filters.subject && (
                    <Button variant="primary" onClick={() => navigate("/admin/professors/create")}>
                    Agregar Primer Profesor
                    </Button>
                )}
                </div>
            ) : (
                <>
                <div className="table-responsive">
                    <Table hover className="mb-0">
                    <thead className="table-light">
                        <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Materia</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {professors.map((professor) => (
                        <tr key={professor.id}>
                            <td>
                            <div className="fw-medium">{professor.name}</div>
                            </td>
                            <td>
                            <small className="text-muted">{professor.email}</small>
                            </td>
                            <td>
                            <Badge bg="info">{professor.subject}</Badge>
                            </td>
                            <td>
                            <small>{professor.phone || "No especificado"}</small>
                            </td>
                            <td>
                            <Badge bg={professor.isActive ? "success" : "secondary"}>
                                {professor.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            </td>
                            <td>
                            <div className="btn-group btn-group-sm">
                                <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/admin/professors/${professor.id}`)}
                                title="Ver detalles"
                                >
                                <i className="bi bi-eye"></i>
                                </Button>
                                <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => navigate(`/admin/professors/edit/${professor.id}`)}
                                title="Editar"
                                >
                                <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteClick(professor)}
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
        <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, professor: null })}>
            <Modal.Header closeButton>
            <Modal.Title>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <p>
                ¿Estás seguro de que deseas eliminar al profesor <strong>{deleteModal.professor?.name}</strong>?
            </p>
            <Alert variant="warning" className="mb-0">
                <small>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Esta acción no se puede deshacer. También se eliminarán todas las preguntas asociadas a este profesor.
                </small>
            </Alert>
            </Modal.Body>
            <Modal.Footer>
            <Button
                variant="secondary"
                onClick={() => setDeleteModal({ show: false, professor: null })}
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

export default ProfessorsList