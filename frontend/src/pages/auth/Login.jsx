import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Validaciones básicas
        if (!formData.email || !formData.password) {
            setError("Por favor completa todos los campos")
            setLoading(false)
            return
        }

        try {
            const result = await login(formData.email, formData.password)

            if (result.success) {
                // Redirigir según el rol
                if (result.user.role === "ADMIN") {
                navigate("/admin/dashboard")
                } else {
                navigate("/student/dashboard")
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
            <Col xs={12} sm={8} md={6} lg={4} className="mx-auto">
            <Card className="shadow">
                <Card.Body className="p-4">
                <div className="text-center mb-4">
                    <h2 className="text-primary fw-bold">ExamPass</h2>
                    <p className="text-muted">Inicia sesión en tu cuenta</p>
                </div>

                {error && (
                    <Alert variant="danger" className="mb-3">
                    {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
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
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Tu contraseña"
                        required
                        disabled={loading}
                    />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                    {loading ? (
                        <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Iniciando sesión...
                        </>
                    ) : (
                        "Iniciar Sesión"
                    )}
                    </Button>
                </Form>

                <div className="text-center">
                    <p className="mb-0">
                    ¿No tienes cuenta?{" "}
                    <Link to="/register" className="text-primary text-decoration-none">
                        Regístrate aquí
                    </Link>
                    </p>
                </div>
                </Card.Body>
            </Card>

            {/* Información de prueba para desarrollo */}
            {import.meta.env.DEV && (
                <Card className="mt-3 border-info">
                <Card.Body className="p-3">
                    <h6 className="text-info mb-2">Cuentas de prueba:</h6>
                    <small className="text-muted d-block">
                    <strong>Admin:</strong> admin@exampass.com / 12345678
                    </small>
                    <small className="text-muted d-block">
                    <strong>Estudiante:</strong> estudiante@exampass.com / 12345678
                    </small>
                </Card.Body>
                </Card>
            )}
            </Col>
        </Row>
        </Container>
    )
}

export default Login
