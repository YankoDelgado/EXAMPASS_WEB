import { useState, useEffect } from "react"
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, Badge } from "react-bootstrap"
import { useNavigate, useParams } from "react-router-dom"
import { questionService } from "../../../services/questionService"
import { professorService } from "../../../services/professorService"

const QuestionsEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loadingProfessors, setLoadingProfessors] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [professors, setProfessors] = useState([])

    const [formData, setFormData] = useState({
        header: "",
        alternatives: ["", "", "", ""],
        correctAnswer: 0,
        educationalIndicator: "",
        professorId: "",
        isActive: true,
    })

    const [originalData, setOriginalData] = useState({})
    const [errors, setErrors] = useState({})

    useEffect(() => {
        loadQuestion()
        loadProfessors()
    }, [id])

    const loadQuestion = async () => {
        try {
            setLoading(true)
            setError("")
            const data = await questionService.getById(id)

            const questionData = {
                header: data.question.header || "",
                alternatives: data.question.alternatives || ["", "", "", ""],
                correctAnswer: data.question.correctAnswer || 0,
                educationalIndicator: data.question.educationalIndicator || "",
                professorId: data.question.professorId || "",
                isActive: data.question.isActive ?? true,
            }

            setFormData(questionData)
            setOriginalData(questionData)
        } catch (error) {
            console.error("Error cargando pregunta:", error)
            if (error.response?.status === 404) {
                setError("Pregunta no encontrada")
            } else {
                setError("Error cargando datos de la pregunta")
            }
        } finally {
            setLoading(false)
        }
    }

    const loadProfessors = async () => {
        try {
            setLoadingProfessors(true)
            const data = await professorService.getAll({ limit: 100, isActive: true })
            setProfessors(data.professors || [])
        } catch (error) {
            console.error("Error cargando profesores:", error)
        } finally {
            setLoadingProfessors(false)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))

        // Limpiar error del campo
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }))
        }

        // Limpiar mensaje de éxito si el usuario modifica algo
        if (success) {
            setSuccess("")
        }
    }

    const handleAlternativeChange = (index, value) => {
        const newAlternatives = [...formData.alternatives]
        newAlternatives[index] = value
        setFormData((prev) => ({
            ...prev,
            alternatives: newAlternatives,
        }))

        // Limpiar errores de alternativas
        if (errors.alternatives) {
            setErrors((prev) => ({
                ...prev,
                alternatives: "",
            }))
        }

        if (success) {
            setSuccess("")
        }
    }

    const addAlternative = () => {
        if (formData.alternatives.length < 6) {
            setFormData((prev) => ({
                ...prev,
                alternatives: [...prev.alternatives, ""],
            }))
        }
    }

    const removeAlternative = (index) => {
        if (formData.alternatives.length > 2) {
            const newAlternatives = formData.alternatives.filter((_, i) => i !== index)
            setFormData((prev) => ({
                ...prev,
                alternatives: newAlternatives,
                correctAnswer:
                prev.correctAnswer >= index && prev.correctAnswer > 0 ? prev.correctAnswer - 1 : prev.correctAnswer,
            }))
            }
    }

    const validateForm = () => {
        const newErrors = {}

        // Validar pregunta
        if (!formData.header.trim()) {
            newErrors.header = "La pregunta es requerida"
        } else if (formData.header.trim().length < 10) {
            newErrors.header = "La pregunta debe tener al menos 10 caracteres"
        }

        // Validar profesor
        if (!formData.professorId) {
            newErrors.professorId = "Debe seleccionar un profesor"
        }

        // Validar indicador educativo
        if (!formData.educationalIndicator.trim()) {
            newErrors.educationalIndicator = "El indicador educativo es requerido"
        }

        // Validar alternativas
        const validAlternatives = formData.alternatives.filter((alt) => alt.trim() !== "")
        if (validAlternatives.length < 2) {
            newErrors.alternatives = "Debe tener al menos 2 alternativas válidas"
        }

        // Verificar que todas las alternativas no vacías sean únicas
        const uniqueAlternatives = new Set(validAlternatives.map((alt) => alt.trim().toLowerCase()))
        if (uniqueAlternatives.size !== validAlternatives.length) {
            newErrors.alternatives = "Las alternativas deben ser únicas"
        }

        // Validar respuesta correcta
        if (formData.correctAnswer >= validAlternatives.length) {
            newErrors.correctAnswer = "La respuesta correcta debe ser una de las alternativas válidas"
        }

        // Verificar que la respuesta correcta no esté vacía
        if (!formData.alternatives[formData.correctAnswer]?.trim()) {
            newErrors.correctAnswer = "La respuesta correcta no puede estar vacía"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const hasChanges = () => {
        return JSON.stringify(formData) !== JSON.stringify(originalData)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        if (!hasChanges()) {
            setError("No se han realizado cambios")
            return
        }

        try {
            setSaving(true)
            setError("")
            setSuccess("")

            // Filtrar alternativas vacías y ajustar índice de respuesta correcta
            const validAlternatives = formData.alternatives
                .map((alt, index) => ({ text: alt.trim(), originalIndex: index }))
                .filter((alt) => alt.text !== "")

            const correctAnswerIndex = validAlternatives.findIndex((alt) => alt.originalIndex === formData.correctAnswer)

            const questionData = {
                header: formData.header.trim(),
                alternatives: validAlternatives.map((alt) => alt.text),
                correctAnswer: correctAnswerIndex,
                educationalIndicator: formData.educationalIndicator.trim(),
                professorId: formData.professorId,
                isActive: formData.isActive,
            }

            await questionService.update(id, questionData)

            setSuccess("Pregunta actualizada exitosamente")
            setOriginalData(formData) // Actualizar datos originales

            // Opcional: redirigir después de unos segundos
            setTimeout(() => {
                navigate(`/admin/questions/${id}`)
            }, 2000)
        } catch (error) {
            console.error("Error actualizando pregunta:", error)

            if (error.response?.status === 400) {
                setError(error.response.data.error || "Datos inválidos")
            } else if (error.response?.status === 404) {
                setError("Pregunta no encontrada")
            } else {
                setError("Error actualizando pregunta. Intenta nuevamente.")
            }
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        if (hasChanges()) {
            if (window.confirm("¿Estás seguro? Se perderán los cambios no guardados.")) {
                navigate(`/admin/questions/${id}`)
            }
        } else {
            navigate(`/admin/questions/${id}`)
        }
    }

    if (loading || loadingProfessors) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
                </div>
            </Container>
        )
    }

    if (error && !formData.header) {
        return (
            <Container>
                <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <div className="d-flex gap-2">
                    <Button variant="outline-danger" onClick={loadQuestion}>
                    Reintentar
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/admin/questions")}>
                    Volver a Lista
                    </Button>
                </div>
                </Alert>
            </Container>
        )
    }

    return (
        <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Editar Pregunta</h1>
            <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate(`/admin/questions/${id}`)}>
                Ver Detalles
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/admin/questions")}>
                Volver a Lista
            </Button>
            </div>
        </div>

        <Row>
            <Col lg={10} className="mx-auto">
            <Card>
                <Card.Header>
                <h5 className="mb-0">Editar Información de la Pregunta</h5>
                </Card.Header>
                <Card.Body>
                {error && (
                    <Alert variant="danger" className="mb-3">
                    {error}
                    </Alert>
                )}

                {success && (
                    <Alert variant="success" className="mb-3">
                    {success}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    {/* Pregunta principal */}
                    <Form.Group className="mb-4">
                    <Form.Label>
                        Pregunta <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="header"
                        value={formData.header}
                        onChange={handleChange}
                        placeholder="Escribe aquí la pregunta..."
                        isInvalid={!!errors.header}
                        disabled={saving}
                    />
                    <Form.Text className="text-muted">{formData.header.length} caracteres</Form.Text>
                    <Form.Control.Feedback type="invalid">{errors.header}</Form.Control.Feedback>
                    </Form.Group>

                    {/* Profesor e Indicador */}
                    <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                        <Form.Label>
                            Profesor <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                            name="professorId"
                            value={formData.professorId}
                            onChange={handleChange}
                            isInvalid={!!errors.professorId}
                            disabled={saving}
                        >
                            <option value="">Seleccionar profesor...</option>
                            {professors.map((professor) => (
                            <option key={professor.id} value={professor.id}>
                                {professor.name} - {professor.subject}
                            </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.professorId}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                        <Form.Label>
                            Indicador Educativo <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="educationalIndicator"
                            value={formData.educationalIndicator}
                            onChange={handleChange}
                            placeholder="Ej: Álgebra básica, Comprensión lectora..."
                            isInvalid={!!errors.educationalIndicator}
                            disabled={saving}
                        />
                        <Form.Control.Feedback type="invalid">{errors.educationalIndicator}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    </Row>

                    {/* Alternativas */}
                    <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Form.Label className="mb-0">
                        Alternativas <span className="text-danger">*</span>
                        </Form.Label>
                        <div>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={addAlternative}
                            disabled={formData.alternatives.length >= 6 || saving}
                            className="me-2"
                        >
                            Agregar Alternativa
                        </Button>
                        <Badge bg="info">{formData.alternatives.length} alternativas</Badge>
                        </div>
                    </div>

                    {errors.alternatives && (
                        <Alert variant="danger" className="mb-3">
                        {errors.alternatives}
                        </Alert>
                    )}

                    {formData.alternatives.map((alternative, index) => (
                        <div key={index} className="mb-3">
                        <div className="d-flex align-items-center">
                            <Form.Check
                            type="radio"
                            name="correctAnswer"
                            value={index}
                            checked={formData.correctAnswer === index}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, correctAnswer: Number.parseInt(e.target.value) }))
                            }
                            className="me-3"
                            disabled={saving}
                            />
                            <Form.Control
                            type="text"
                            value={alternative}
                            onChange={(e) => handleAlternativeChange(index, e.target.value)}
                            placeholder={`Alternativa ${index + 1}...`}
                            disabled={saving}
                            className="me-2"
                            />
                            {formData.alternatives.length > 2 && (
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeAlternative(index)}
                                disabled={saving}
                            >
                                <i className="bi bi-trash"></i>
                            </Button>
                            )}
                        </div>
                        {formData.correctAnswer === index && (
                            <small className="text-success ms-4">✓ Respuesta correcta</small>
                        )}
                        </div>
                    ))}

                    {errors.correctAnswer && (
                        <Alert variant="danger" className="mt-2">
                        {errors.correctAnswer}
                        </Alert>
                    )}
                    </div>

                    {/* Estado */}
                    <Form.Group className="mb-4">
                    <Form.Check
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        label="Pregunta activa"
                        disabled={saving}
                    />
                    <Form.Text className="text-muted">Las preguntas inactivas no aparecerán en los exámenes</Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={saving || !hasChanges()}>
                        {saving ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Guardando...
                        </>
                        ) : (
                        "Guardar Cambios"
                        )}
                    </Button>
                    </div>

                    {!hasChanges() && !success && (
                    <div className="text-center mt-3">
                        <small className="text-muted">No se han realizado cambios</small>
                    </div>
                    )}
                </Form>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    )
}

export default QuestionsEdit