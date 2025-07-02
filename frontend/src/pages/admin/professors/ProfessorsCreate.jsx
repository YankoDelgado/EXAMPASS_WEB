import {useState} from "react"
import {Container, Card, Form, Button, Alert, Row, Col, Spinner} from "react-bootstrap"
import {useNavigate} from "react-router-dom"
import {professorService} from "../../../services/professorService"

const ProfessorsCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        phone: "",
        //bio: "",
        isActive: true,
    })

    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        }))

        //Limpiar error del campo cuando el usuario empiece a escribir
        if(errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
        }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        //Validaciones requeridas
        if(!formData.name.trim()) {
            newErrors.name = "El nombre es requerido"
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "El nombre debe tener al menos 2 caracteres"
        }

        if(!formData.email.trim()) {
            newErrors.email = "El email es requerido"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "El email no es válido"
        }

        if(!formData.subject.trim()) {
            newErrors.subject = "La materia es requerida"
        }

        //Validaciones opcionales
        if(formData.phone && !/^[\d\s\-+$$$$]+$/.test(formData.phone)) {
            newErrors.phone = "El teléfono no es válido"
        }

        /*if(formData.bio && formData.bio.length > 500) {
            newErrors.bio = "La biografía no puede exceder 500 caracteres"
        }*/

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)
            setError("")
            setSuccess("")

            const professorData = {
                ...formData,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                subject: formData.subject.trim(),
                phone: formData.phone.trim() || null,
                //bio: formData.bio.trim() || null,
            }

            await professorService.create(professorData)

            setSuccess("Profesor creado exitosamente")

            //Redirigir después de 2 segundos
            setTimeout(() => {
                navigate("/admin/professors")
            }, 2000)
        } catch (error) {
            console.error("Error creando profesor:", error)

            if(error.response?.status === 400) {
                setError(error.response.data.error || "Datos inválidos")
            } else if (error.response?.status === 409) {
                setError("Ya existe un profesor con este email")
            } else {
                setError("Error creando profesor. Intenta nuevamente.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/admin/professors")
    }

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Agregar Nuevo Profesor</h1>
            <Button variant="outline-secondary" onClick={handleCancel}>
            Volver a Lista
            </Button>
        </div>

        <Row>
            <Col lg={8} className="mx-auto">
            <Card>
                <Card.Header>
                <h5 className="mb-0">Información del Profesor</h5>
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
                            disabled={loading}
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
                            disabled={loading}
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
                            disabled={loading}
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
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    </Row>
                    {/*
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
                        disabled={loading}
                    />
                    <Form.Text className="text-muted">{formData.bio.length}/500 caracteres</Form.Text>
                    <Form.Control.Feedback type="invalid">{errors.bio}</Form.Control.Feedback>
                    </Form.Group>
                    */}
                    <Form.Group className="mb-4">
                    <Form.Check
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        label="Profesor activo"
                        disabled={loading}
                    />
                    <Form.Text className="text-muted">
                        Los profesores inactivos no aparecerán en las listas de selección
                    </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Creando...
                        </>
                        ) : (
                        "Crear Profesor"
                        )}
                    </Button>
                    </div>
                </Form>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    )
}

export default ProfessorsCreate