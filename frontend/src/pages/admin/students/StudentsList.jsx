import { Container, Card, Alert } from "react-bootstrap"

const StudentsList = () => {
    return (
        <Container>
        <Card>
            <Card.Body>
            <Alert variant="info">
                <h4>Lista de Estudiantes</h4>
                <p>Aquí podrás ver a los estudiantes.</p>
                <p>
                <strong>Próximamente:</strong> Lista de estudiantes
                </p>
            </Alert>
            </Card.Body>
        </Card>
        </Container>
    )
}

export default StudentsList