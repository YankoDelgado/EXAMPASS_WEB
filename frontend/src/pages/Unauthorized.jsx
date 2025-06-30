import { Container, Alert, Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"

const Unauthorized = () => {
    const navigate = useNavigate()

    return (
        <Container className="mt-5">
        <Alert variant="danger">
            <Alert.Heading>Acceso Denegado</Alert.Heading>
            <p>No tienes permisos para acceder a esta página.</p>
            <hr />
            <div className="d-flex justify-content-end">
            <Button onClick={() => navigate(-1)} variant="outline-danger">
                Volver
            </Button>
            </div>
        </Alert>
        </Container>
    )
}

export default Unauthorized