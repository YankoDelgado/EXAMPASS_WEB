import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge } from "react-bootstrap"
import { examService } from "../../../services/examService"
import { questionService } from "../../../services/questionService"

const ExamsCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [subjects, setSubjects] = useState([])
    const [selectedQuestions, setSelectedQuestions] = useState([])
    const [availableQuestions, setAvailableQuestions] = useState([])

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "",
        duration: 60,
        status: "draft"
    })

    useEffect(() => { loadSubjects() }, [])

    useEffect(() => {
        if (formData.subject) loadQuestionsBySubject()
    }, [formData.subject])

    const loadSubjects = async () => {
        try {
        const data = await questionService.getSubjects()
        setSubjects(data.subjects || [])
        } catch (err) {
        console.error("Error cargando materias:", err)
        }
    }

    const loadQuestionsBySubject = async () => {
        try {
        const data = await questionService.getQuestions({ subject: formData.subject })
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

        if (!formData.subject) {
        setError("La materia es requerida")
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
            ...formData,
            questions: selectedQuestions,
            questionIds: selectedQuestions.map((q) => q.id)
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
        else if (prev.length < 5) return [...prev, question]
        else return prev
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

                <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>Materia <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        value={formData.subject}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                        required
                    >
                        <option value="">Seleccionar materia</option>
                        {subjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="draft">Borrador</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </Form.Select>
                    </Form.Group>
                </Col>
                </Row>

                <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>Duración (minutos)</Form.Label>
                    <Form.Control
                        type="number"
                        min="0"
                        max="300"
                        value={formData.duration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))}
                        disabled={formData.duration === 0}
                    />
                    </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end">
                    <Form.Check
                    type="checkbox"
                    label="Sin límite de tiempo"
                    checked={formData.duration === 0}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.checked ? 0 : 60 }))}
                    />
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
                        label={question.question}
                        checked={selectedQuestions.some((q) => q.id === question.id)}
                        onChange={() => handleQuestionToggle(question)}
                        disabled={!selectedQuestions.some((q) => q.id === question.id) && selectedQuestions.length >= 5}
                        className="mb-2"
                    />
                    ))}
                    <Form.Text className="text-muted">{selectedQuestions.length} / 5 preguntas seleccionadas</Form.Text>
                </>
                ) : (
                <p className="text-muted">No hay preguntas disponibles para esta materia</p>
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
