import React, { useState, useEffect, useCallback } from "react";
import { Container, Card, Button, Alert, Row, Col, Badge, Spinner, ProgressBar, ListGroup } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { studentService } from "../../../services/studentService";

const initialReportState = {
    id: '',
    examResult: {
        percentage: 0,
        totalScore: 0,
        totalQuestions: 0,
        completedAt: new Date().toISOString(),
        exam: {
        title: 'Cargando...',
        description: '',
        timeLimit: 0,
        passingScore: 60
        }
    },
    contentBreakdown: {},
    strengths: [],
    weaknesses: [],
    recommendations: []
    };

    const StudentReportView = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    
    const [report, setReport] = useState(initialReportState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getSafeText = useCallback((value, fallback = "No disponible") => {
        return value || fallback;
    }, []);

    const validateAndSetReportData = useCallback((data) => {
        if (!data?.report || 
            !data.report.id || 
            !data.report.examResult || 
            typeof data.report.examResult.percentage !== 'number') {
        throw new Error("Estructura de datos del reporte inválida");
        }

        const validatedReport = {
        id: data.report.id,
        contentBreakdown: data.report.contentBreakdown || {},
        strengths: data.report.strengths || [],
        weaknesses: data.report.weaknesses || [],
        recommendations: data.report.recommendations || [],
        assignedProfessor: data.report.assignedProfessor || null,
        professorSubject: data.report.professorSubject || null,
        examResult: {
            percentage: data.report.examResult.percentage || 0,
            totalScore: data.report.examResult.totalScore || 0,
            totalQuestions: data.report.examResult.totalQuestions || 0,
            completedAt: data.report.examResult.completedAt || new Date().toISOString(),
            exam: {
            title: data.report.examResult.exam?.title || 'Examen',
            description: data.report.examResult.exam?.description || '',
            timeLimit: data.report.examResult.exam?.timeLimit || 0,
            passingScore: data.report.examResult.exam?.passingScore || 60
            }
        }
        };

        setReport(validatedReport);
    }, []);

    const loadReport = useCallback(async () => {
        try {
        if (!reportId?.match(/^[a-zA-Z0-9-_]+$/)) {
            throw new Error("Formato de ID de reporte no válido");
        }

        const data = await studentService.getReport(reportId);
        validateAndSetReportData(data);
        
        } catch (error) {
        console.error("Error cargando reporte:", {
            error: error.message,
            reportId,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        throw error;
        }
    }, [reportId, validateAndSetReportData]);

    const handleLoadReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
        await loadReport();
        } catch (error) {
        const errorMessage = error.message || "Error desconocido al cargar el reporte";
        setError(errorMessage);
        
        if (error.message.match(/no válido|inválida|no encontrado/i)) {
            navigate("/student/reports", {
            state: { 
                error: errorMessage,
                reportId 
            },
            replace: true
            });
        }
        } finally {
        setLoading(false);
        }
    }, [loadReport, navigate, reportId]);

    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
        try {
            if (isMounted) {
            await handleLoadReport();
            }
        } catch (error) {
            if (isMounted) {
            setError(error.message);
            }
        }
        };

        initialize();

        return () => {
        isMounted = false;
        };
    }, [handleLoadReport]);

    const handleRetry = useCallback(() => {
        handleLoadReport();
    }, [handleLoadReport]);

    const getScoreColor = useCallback((percentage) => {
        if (percentage >= 90) return "success";
        if (percentage >= 80) return "info";
        if (percentage >= 70) return "warning";
        return "danger";
    }, []);

    const getPerformanceLevel = useCallback((percentage) => {
        if (percentage >= 90) return { level: "Excelente", icon: "bi-trophy-fill", color: "success" };
        if (percentage >= 80) return { level: "Muy Bueno", icon: "bi-star-fill", color: "info" };
        if (percentage >= 70) return { level: "Bueno", icon: "bi-check-circle-fill", color: "warning" };
        if (percentage >= 60) return { level: "Regular", icon: "bi-check-circle", color: "primary" };
        return { level: "Necesita Mejorar", icon: "bi-x-circle-fill", color: "danger" };
    }, []);

    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        });
    }, []);

    if (loading) {
        return (
        <Container>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando reporte...</span>
            </Spinner>
            </div>
        </Container>
        );
    }

    if (error) {
        return (
        <Container>
            <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <div className="d-flex gap-2">
                <Button variant="outline-danger" onClick={handleRetry}>
                Reintentar
                </Button>
                <Button variant="secondary" onClick={() => navigate("/student/reports")}>
                Volver a Reportes
                </Button>
            </div>
            </Alert>
        </Container>
        );
    }

    if (!report || !report.id) {
        return (
        <Container>
            <Alert variant="warning">
            <Alert.Heading>Reporte no encontrado</Alert.Heading>
            <p>El reporte que buscas no existe o no tienes permisos para verlo.</p>
            <Button variant="outline-warning" onClick={() => navigate("/student/reports")}>
                Volver a Reportes
            </Button>
            </Alert>
        </Container>
        );
    }

    const performance = getPerformanceLevel(report.examResult?.percentage || 0);

    return (
        <Container>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
            <h1>Reporte Detallado</h1>
            <p className="text-muted">{getSafeText(report.examResult?.exam?.title)}</p>
            </div>
            <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate("/student/exam")}>
                Tomar Nuevo Examen
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/student/reports")}>
                Volver a Reportes
            </Button>
            </div>
        </div>

        {/* Resumen del examen */}
        <Row className="mb-4">
            <Col>
            <Card className="shadow-sm">
                <Card.Header className={`bg-${performance.color} text-white`}>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                    <i className={`${performance.icon} me-2`}></i>
                    Resultado General
                    </h5>
                    <Badge bg="light" text="dark" className="fs-6">
                    {formatDate(report.examResult?.completedAt)}
                    </Badge>
                </div>
                </Card.Header>
                <Card.Body>
                <Row className="text-center">
                    <Col md={3}>
                    <div className="mb-3">
                        <div className={`display-4 text-${performance.color} fw-bold`}>
                        {report.examResult?.percentage || 0}%
                        </div>
                        <h6 className={`text-${performance.color}`}>{performance.level}</h6>
                    </div>
                    </Col>
                    <Col md={3}>
                    <div className="mb-3">
                        <div className="display-6 text-success fw-bold">{report.examResult?.totalScore}</div>
                        <small className="text-muted">Respuestas Correctas</small>
                    </div>
                    </Col>
                    <Col md={3}>
                    <div className="mb-3">
                        <div className="display-6 text-danger fw-bold">
                        {(report.examResult?.totalQuestions || 0) - (report.examResult?.totalScore || 0)}
                        </div>
                        <small className="text-muted">Respuestas Incorrectas</small>
                    </div>
                    </Col>
                    <Col md={3}>
                    <div className="mb-3">
                        <div className="display-6 text-primary fw-bold">{report.examResult?.totalQuestions}</div>
                        <small className="text-muted">Total Preguntas</small>
                    </div>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        <Row>
            {/* Análisis por contenido */}
            <Col lg={8} className="mb-4">
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-bar-chart me-2"></i>
                    Análisis por Contenido Educativo
                </h5>
                </Card.Header>
                <Card.Body>
                {report.contentBreakdown && Object.keys(report.contentBreakdown).length > 0 ? (
                    <div>
                    {Object.entries(report.contentBreakdown)
                        .filter(([key]) => key !== "subjects")
                        .map(([indicator, percentage]) => (
                        <div key={indicator} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-medium">{indicator}</span>
                            <Badge bg={getScoreColor(percentage)}>{percentage}%</Badge>
                            </div>
                            <ProgressBar 
                            now={percentage} 
                            variant={getScoreColor(percentage)} 
                            style={{ height: "12px" }} 
                            />
                        </div>
                        ))}

                    {/* Análisis por materias */}
                    {report.contentBreakdown.subjects && (
                        <div className="mt-4">
                        <h6 className="text-primary mb-3">Rendimiento por Materia</h6>
                        {Object.entries(report.contentBreakdown.subjects).map(([subject, percentage]) => (
                            <div key={subject} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-medium">{subject}</span>
                                <Badge bg={getScoreColor(percentage)}>{percentage}%</Badge>
                            </div>
                            <ProgressBar
                                now={percentage}
                                variant={getScoreColor(percentage)}
                                style={{ height: "10px" }}
                            />
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                ) : (
                    <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    El análisis detallado por contenido no está disponible para este reporte.
                    </Alert>
                )}
                </Card.Body>
            </Card>
            </Col>

            {/* Fortalezas y debilidades */}
            <Col lg={4} className="mb-4">
            <Card className="mb-3">
                <Card.Header className="bg-success text-white">
                <h6 className="mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    Fortalezas
                </h6>
                </Card.Header>
                <Card.Body>
                {report.strengths && report.strengths.length > 0 ? (
                    <ListGroup variant="flush">
                    {report.strengths.map((strength, index) => (
                        <ListGroup.Item key={`strength-${index}`} className="px-0 py-2">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {strength}
                        </ListGroup.Item>
                    ))}
                    </ListGroup>
                ) : (
                    <p className="text-muted mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Continúa practicando para identificar tus fortalezas.
                    </p>
                )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Áreas de Mejora
                </h6>
                </Card.Header>
                <Card.Body>
                {report.weaknesses && report.weaknesses.length > 0 ? (
                    <ListGroup variant="flush">
                    {report.weaknesses.map((weakness, index) => (
                        <ListGroup.Item key={`weakness-${index}`} className="px-0 py-2">
                        <i className="bi bi-arrow-right-circle text-warning me-2"></i>
                        {weakness}
                        </ListGroup.Item>
                    ))}
                    </ListGroup>
                ) : (
                    <p className="text-muted mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    ¡Excelente! No se identificaron áreas específicas de mejora.
                    </p>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Recomendaciones */}
        <Row className="mb-4">
            <Col>
            <Card>
                <Card.Header>
                <h5 className="mb-0">
                    <i className="bi bi-lightbulb me-2"></i>
                    Recomendaciones Personalizadas
                </h5>
                </Card.Header>
                <Card.Body>
                {report.recommendations && report.recommendations.length > 0 ? (
                    <div>
                    {report.recommendations.map((recommendation, index) => (
                        <Alert key={`recommendation-${index}`} variant="info" className="mb-2">
                        <i className="bi bi-info-circle me-2"></i>
                        {recommendation}
                        </Alert>
                    ))}
                    </div>
                ) : (
                    <Alert variant="secondary">
                    <i className="bi bi-info-circle me-2"></i>
                    No hay recomendaciones específicas disponibles para este reporte.
                    </Alert>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Profesor recomendado */}
        {report.assignedProfessor && (
            <Row className="mb-4">
            <Col>
                <Card className="border-primary">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                    <i className="bi bi-person-check me-2"></i>
                    Profesor Recomendado
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center">
                    <Col md={8}>
                        <h6 className="text-primary mb-1">{report.assignedProfessor}</h6>
                        <p className="text-muted mb-2">Especialista en: {report.professorSubject}</p>
                        <p className="mb-0">
                        Basado en tu rendimiento, te recomendamos contactar a este profesor para recibir apoyo adicional
                        en las áreas que necesitas reforzar.
                        </p>
                    </Col>
                    <Col md={4} className="text-end">
                        <Button variant="primary" onClick={() => navigate("/student/professors")}>
                        <i className="bi bi-envelope me-2"></i>
                        Contactar Profesor
                        </Button>
                    </Col>
                    </Row>
                </Card.Body>
                </Card>
            </Col>
            </Row>
        )}

        {/* Información del examen */}
        <Row>
            <Col>
            <Card>
                <Card.Header>
                <h6 className="mb-0">Información del Examen</h6>
                </Card.Header>
                <Card.Body>
                <Row>
                    <Col md={6}>
                    <div className="mb-2">
                        <strong className="text-muted">Examen:</strong>
                        <div>{report.examResult?.exam?.title}</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">Descripción:</strong>
                        <div>{getSafeText(report.examResult?.exam?.description, "Sin descripción")}</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">Fecha de realización:</strong>
                        <div>{formatDate(report.examResult?.completedAt)}</div>
                    </div>
                    </Col>
                    <Col md={6}>
                    <div className="mb-2">
                        <strong className="text-muted">Tiempo límite:</strong>
                        <div>{report.examResult?.exam?.timeLimit} minutos</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">Puntaje mínimo:</strong>
                        <div>{report.examResult?.exam?.passingScore || 60}%</div>
                    </div>
                    <div className="mb-2">
                        <strong className="text-muted">ID del reporte:</strong>
                        <div>
                        <code>{report.id}</code>
                        </div>
                    </div>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    );
};

export default React.memo(StudentReportView);