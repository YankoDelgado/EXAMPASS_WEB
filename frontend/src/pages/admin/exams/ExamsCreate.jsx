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

    useEffect(() => { 
        loadQuestions() 
    }, [])

    const loadQuestions = async () => {
        try {
            const data = await questionService.getAll({ isActive: true, limit: 100 })
            console.log("Preguntas obtenidas:", data)
            if (data && data.questions) {
                setAvailableQuestions(data.questions)
            } else {
                console.error("Formato de datos inesperado:", data)
                setAvailableQuestions([])
            }
        } catch (err) {
            console.error("Error cargando preguntas:", err)
            setError("Error al cargar las preguntas")
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validaciones mejoradas
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
                timeLimit: formData.timeLimit === 0 ? null : formData.timeLimit, 
                questionIds: selectedQuestions.map((q) => q.id),
                totalQuestions: selectedQuestions.length,
            }

            console.log("Datos a enviar:", examData)

            const response = await examService.createExam(examData)
            
            if (response && response.success) {
                navigate("/admin/exams")
            } else {
                setError(response?.message || "Error al crear el examen")
            }
        } catch (err) {
            console.error("Error en handleSubmit:", err)
            setError(err.response?.data?.message || "Error al crear el examen")
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

            {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Card className="mb-4">
                    <Card.Header><strong>Información del Examen</strong></Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group controlId="formTitle">
                                    <Form.Label>Título del Examen <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Ingrese el título del examen"
                                        required
                                        isInvalid={!formData.title.trim() && error}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group controlId="formDescription">
                                    <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descripción del examen"
                                        required
                                        isInvalid={!formData.description.trim() && error}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group controlId="formStatus">
                                    <Form.Label>Estado</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="DRAFT">Borrador</option>
                                        <option value="ACTIVE">Activo</option>
                                        <option value="INACTIVE">Inactivo</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group controlId="formTimeLimit">
                                    <Form.Label>Duración (minutos)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="300"
                                        value={formData.timeLimit}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0
                                            setFormData(prev => ({ ...prev, timeLimit: value }))
                                        }}
                                        disabled={formData.timeLimit === 0}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        label="Sin límite de tiempo"
                                        checked={formData.timeLimit === 0}
                                        onChange={(e) => 
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                timeLimit: e.target.checked ? 0 : 60 
                                            }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-4">
                    <Card.Header>
                        <strong>Seleccionar Preguntas</strong>
                        <span className="float-end">
                            {selectedQuestions.length} preguntas seleccionadas
                        </span>
                    </Card.Header>
                    <Card.Body>
                        {availableQuestions.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {availableQuestions.map((question) => (
                                    <Card key={question.id} className="mb-2">
                                        <Card.Body className="p-2">
                                            <Form.Check
                                                type="checkbox"
                                                id={`question-${question.id}`}
                                                label={
                                                    <>
                                                        <strong>{question.header}</strong>
                                                        <div className="text-muted small">
                                                            {question.type} - {question.difficulty}
                                                        </div>
                                                    </>
                                                }
                                                checked={selectedQuestions.some(q => q.id === question.id)}
                                                onChange={() => handleQuestionToggle(question)}
                                            />
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Alert variant="info">No hay preguntas disponibles</Alert>
                        )}
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2 mb-4">
                    <Button variant="secondary" onClick={() => navigate("/admin/exams")} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Creando...
                            </>
                        ) : "Crear Examen"}
                    </Button>
                </div>
            </Form>
        </Container>
    )
}

export default ExamsCreate
