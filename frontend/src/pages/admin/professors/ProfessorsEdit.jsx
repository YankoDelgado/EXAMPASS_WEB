
import { useState, useEffect } from "react"
import { Container, Card, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import { professorService } from "../../../services/professorService"

const ProfessorsEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        phone: "",
        bio: "",
        isActive: true,
    })

    const [errors, setErrors] = useState({})
    const [originalData, setOriginalData] = useState({})

    useEffect(() => {loadProfessor()}, [id])

    const loadProfessor = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await professorService.getById(id)

            const professorData = {
                name: data.professor.name || "",
                email: data.professor.email || "",
                subject: data.professor.subject || "",
                phone: data.professor.phone || "",
                bio: data.professor.bio || "",
                isActive: data.professor.isActive ?? true,
            }

            setFormData(professorData)
            setOriginalData(professorData)
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))

        //Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }))
        }

        //Limpiar mensaje de éxito si el usuario modifica algo
        if (success) {
            setSuccess("")
        }
    }

    const validateForm = () => {
        const newErrors = {}

        //Validaciones requeridas
        if (!formData.name.trim()) {
            newErrors.name = "El nombre es requerido"
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "El nombre debe tener al menos 2 caracteres"
        }

        if (!formData.email.trim()) {
            newErrors.email = "El email es requerido"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "El email no es válido"
        }

        if (!formData.subject.trim()) {
            newErrors.subject = "La materia es requerida"
        }

        // Validaciones opcionales
        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            newErrors.phone = "El teléfono no es válido"
        }

        if (formData.bio && formData.bio.length > 500) {
            newErrors.bio = "La biografía no puede exceder 500 caracteres"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const hasChanges = () => {
        return JSON.stringify(formData) !== JSON.stringify(originalData)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        if (!hasChanges()) {
            setError("No se han realizado cambios")
            return
        }

        try {
            setSaving(true)
            setError("")
            setSuccess("")

            const professorData = {
                ...formData,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                subject: formData.subject.trim(),
                phone: formData.phone.trim() || null,
                bio: formData.bio.trim() || null,
            }

            await professorService.update(id, professorData)

            setSuccess("Profesor actualizado exitosamente")
            setOriginalData(formData) //Actualizar datos originales

            //Opcional: redirigir después de unos segundos
            setTimeout(() => {
                navigate(`/admin/professors/${id}`)
            }, 2000)
        } catch (error) {
            console.error("Error actualizando profesor:", error)

            if (error.response?.status === 400) {
                setError(error.response.data.error || "Datos inválidos")
            } else if (error.response?.status === 404) {
                setError("Profesor no encontrado")
            } else if (error.response?.status === 409) {
                setError("Ya existe un profesor con este email")
            } else {
                setError("Error actualizando profesor. Intenta nuevamente.")
            }
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        if (hasChanges()) {
            if (window.confirm("¿Estás seguro? Se perderán los cambios no guardados.")) {
                navigate(`/admin/professors/${id}`)
            }
        } else {
            navigate(`/admin/professors/${id}`)
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

    if (error && !formData.name) {
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

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Editar Profesor</h1>
            <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate(`/admin/professors/${id}`)}>
                Ver Detalles
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/professors")}>
                Volver a Lista
            </Button>
            </div>
        </div>

        <Row>
            <Col lg={8} className="mx-auto">
            <Card>
                <Card.Header>
                <h5 className="mb-0">Editar Información del Profesor</h5>
                </Card.Header>
                <Card.Body>
                {error && (
                    <Alert variant="danger" className="mb-3">
                    {error}
                    </Alert>
                )}

                {success && (
                    <Alert variant="success" className="mb-3">
                    {success}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                        <Form.Label>
                            Nombre completo <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez"
                            isInvalid={!!errors.name}
                            disabled={saving}
                        />
                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                        <Form.Label>
                            Email <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="profesor@email.com"
                            isInvalid={!!errors.email}
                            disabled={saving}
                        />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    </Row>

                    <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                        <Form.Label>
                            Materia <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Ej: Matemáticas"
                            isInvalid={!!errors.subject}
                            disabled={saving}
                        />
                        <Form.Control.Feedback type="invalid">{errors.subject}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Ej: +1234567890"
                            isInvalid={!!errors.phone}
                            disabled={saving}
                        />
                        <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    </Row>

                    <Form.Group className="mb-3">
                    <Form.Label>Biografía</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Información adicional sobre el profesor..."
                        isInvalid={!!errors.bio}
                        disabled={saving}
                    />
                    <Form.Text className="text-muted">{formData.bio.length}/500 caracteres</Form.Text>
                    <Form.Control.Feedback type="invalid">{errors.bio}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                    <Form.Check
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        label="Profesor activo"
                        disabled={saving}
                    />
                    <Form.Text className="text-muted">
                        Los profesores inactivos no aparecerán en las listas de selección
                    </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={saving || !hasChanges()}>
                        {saving ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Guardando...
                        </>
                        ) : (
                        "Guardar Cambios"
                        )}
                    </Button>
                    </div>

                    {!hasChanges() && !success && (
                    <div className="text-center mt-3">
                        <small className="text-muted">No se han realizado cambios</small>
                    </div>
                    )}
                </Form>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    )
}

export default ProfessorsEdit
