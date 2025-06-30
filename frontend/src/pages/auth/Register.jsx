import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT", //Por defecto estudiante
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const {register} = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value,
        })
    }

    const validateForm = () => {
        if(!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            return "Por favor completa todos los campos"
        }

        if(formData.name.length < 2) {
            return "El nombre debe tener al menos 2 caracteres"
        }

        if(formData.password.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres"
        }

        if(formData.password !== formData.confirmPassword) {
            return "Las contraseñas no coinciden"
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if(!emailRegex.test(formData.email)) {
            return "Por favor ingresa un email válido"
        }

        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        //Validaciones
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            setLoading(false)
            return
        }

        try {
            const result = await register({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: formData.role,
            })

            if(result.success) {
                //Redirigir según el rol
                if (result.user.role === "ADMIN") {
                    navigate("/admin/dashboard")
                } else {
                //Para estudiantes, ir al onboarding si no lo han completado
                    navigate("/student/onboarding")
                }
            } else {
                setError(result.error)
            }
        } catch (error) {
            setError("Error inesperado. Intenta nuevamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <Row className="w-100">
            <Col xs={12} sm={8} md={6} lg={5} className="mx-auto">
            <Card className="shadow">
                <Card.Body className="p-4">
                <div className="text-center mb-4">
                    <h2 className="text-primary fw-bold">ExamPass</h2>
                    <p className="text-muted">Crea tu cuenta</p>
                </div>

                {error && (
                    <Alert variant="danger" className="mb-3">
                    {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                    <Form.Label>Nombre completo</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                        required
                        disabled={loading}
                    />
                    </Form.Group>

                    <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        required
                        disabled={loading}
                    />
                    </Form.Group>

                    <Form.Group className="mb-3">
                    <Form.Label>Tipo de cuenta</Form.Label>
                    <Form.Select name="role" value={formData.role} onChange={handleChange} disabled={loading}>
                        <option value="STUDENT">Estudiante</option>
                        <option value="ADMIN">Administrador</option>
                    </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 8 caracteres"
                        required
                        disabled={loading}
                    />
                    <Form.Text className="text-muted">La contraseña debe tener al menos 8 caracteres</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                    <Form.Label>Confirmar contraseña</Form.Label>
                    <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repite tu contraseña"
                        required
                        disabled={loading}
                    />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                    {loading ? (
                        <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creando cuenta...
                        </>
                    ) : (
                        "Crear Cuenta"
                    )}
                    </Button>
                </Form>

                <div className="text-center">
                    <p className="mb-0">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-primary text-decoration-none">
                        Inicia sesión aquí
                    </Link>
                    </p>
                </div>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    )
}

export default Register
