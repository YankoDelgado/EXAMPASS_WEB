import { Container, Card, Alert } from "react-bootstrap"

const UserProfile = () => {
    return (
        <Container>
        <Card>
            <Card.Body>
            <Alert variant="info">
                <h4>Perfil de Usuario</h4>
                <p>Aquí podrás ver y editar tu perfil.</p>
                <p>
                <strong>Próximamente:</strong> Formulario de perfil
                </p>
            </Alert>
            </Card.Body>
        </Card>
        </Container>
    )
}

export default UserProfile