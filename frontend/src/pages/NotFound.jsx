import {Container, Alert, Button} from "react-bootstrap"
import {useNavigate} from "react-router-dom"

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <Container className="mt-5">
        <Alert variant="warning">
            <Alert.Heading>Página No Encontrada</Alert.Heading>
            <p>La página que buscas no existe.</p>
            <hr />
            <div className="d-flex justify-content-end">
            <Button onClick={() => navigate("/")} variant="outline-warning">
                Ir al Inicio
            </Button>
            </div>
        </Alert>
        </Container>
    )
}

export default NotFound