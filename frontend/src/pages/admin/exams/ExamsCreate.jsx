import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from "react-bootstrap"
import { examService } from "../../../services/examService"
import { questionService } from "../../../services/questionService"

const ExamsCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [selectedQuestions, setSelectedQuestions] = useState([])
    const [availableQuestions, setAvailableQuestions] = useState([])

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "DRAFT",
        timeLimit: 60,
    })

    useEffect(() => { loadQuestions() }, [])

    const loadQuestions = async () => {
        try {
        const data = await questionService.getQuestions({ isActive: true })
        setAvailableQuestions(data.questions || [])
        } catch (err) {
        console.error("Error cargando preguntas:", err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title.trim()) {
        setError("El título es requerido")
        return
        }

        if (!formData.description.trim()) {
        setError("La descripción es requerida")
        return
        }

        if (selectedQuestions.length === 0) {
        setError("Debes seleccionar al menos una pregunta")
        return
        }

        try {
        setLoading(true)
        setError("")

        const examData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            status: formData.status,
            timeLimit: formData.timeLimit,
            questionIds: selectedQuestions.map((q) => q.id),
            totalQuestions: selectedQuestions.length,
        }

        await examService.createExam(examData)
        navigate("/admin/exams")
        } catch (err) {
        setError("Error al crear el examen")
        console.error(err)
        } finally {
        setLoading(false)
        }
    }

    const handleQuestionToggle = (question) => {
        setSelectedQuestions((prev) => {
        const exists = prev.find((q) => q.id === question.id)
        if (exists) return prev.filter((q) => q.id !== question.id)
        else return [...prev, question]
        })
    }

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h1>Crear Nuevo Examen</h1>
            <p className="text-muted">Configura un nuevo examen para los estudiantes</p>
            </div>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/exams")}>Volver a Lista</Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
            <Card className="mb-4">
            <Card.Header><strong>Información del Examen</strong></Card.Header>
            <Card.Body>
                <Row className="mb-3">
                <Col md={12}>
                    <Form.Group>
                    <Form.Label>Título del Examen <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Ingrese el título del examen"
                        required
                    />
                    </Form.Group>
                </Col>
                </Row>

                <Row className="mb-3">
                <Col md={12}>
                    <Form.Group>
                    <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Descripción del examen"
                        required
                    />
                    </Form.Group>
                </Col>
                </Row>

                <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="DRAFT">Borrador</option>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                    </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>Duración (minutos)</Form.Label>
                    <Form.Control
                        type="number"
                        min="0"
                        max="300"
                        value={formData.timeLimit}
                        onChange={(e) => setFormData((prev) => ({ ...prev, timeLimit: Number.parseInt(e.target.value) }))}
                        disabled={formData.timeLimit === 0}
                    />
                    <Form.Check
                        type="checkbox"
                        label="Sin límite de tiempo"
                        checked={formData.timeLimit === 0}
                        onChange={(e) => setFormData((prev) => ({ ...prev, timeLimit: e.target.checked ? 0 : 60 }))}
                    />
                    </Form.Group>
                </Col>
                </Row>
            </Card.Body>
            </Card>

            <Card className="mb-4">
            <Card.Header><strong>Seleccionar Preguntas</strong></Card.Header>
            <Card.Body>
                {availableQuestions.length > 0 ? (
                <>
                    {availableQuestions.map((question) => (
                    <Form.Check
                        key={question.id}
                        type="checkbox"
                        label={question.header}
                        checked={selectedQuestions.some((q) => q.id === question.id)}
                        onChange={() => handleQuestionToggle(question)}
                        className="mb-2"
                    />
                    ))}
                    <Form.Text className="text-muted">{selectedQuestions.length} preguntas seleccionadas</Form.Text>
                </>
                ) : (
                <p className="text-muted">No hay preguntas disponibles</p>
                )}
            </Card.Body>
            </Card>

            <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => navigate("/admin/exams")} disabled={loading}>
                Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" className="me-2" />Creando...</> : "Crear Examen"}
            </Button>
            </div>
        </Form>
        </Container>
    )
}

export default ExamsCreate
