import { Container, Card, Alert } from "react-bootstrap"

const StudentOnboarding = () => {
    return (
        <Container>
        <Card>
            <Card.Body>
            <Alert variant="info">
                <h4>Onboarding de Estudiante</h4>
                <p>Aquí completarás tu perfil de estudiante (nombre, colegio, email).</p>
                <p>
                <strong>Próximamente:</strong> Formulario de onboarding
                </p>
            </Alert>
            </Card.Body>
        </Card>
        </Container>
    )
}

export default StudentOnboarding