import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Spinner, Container } from "react-bootstrap"

const PrivateRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, user, loading } = useAuth()

    // Mostrar spinner mientras carga
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
                <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </Container>
        )
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Si se requiere un rol específico, verificar
    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}

export default PrivateRoute