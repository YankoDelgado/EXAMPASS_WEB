import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Card, Alert, Spinner, Table, Badge, Button, ButtonGroup, Form, Pagination, Nav, Tab, Tabs } from "react-bootstrap";
import { examService } from "../../../services/examService";

const ExamsResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("results");
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
  });

  useEffect(() => {
    loadExamData();
    loadResults();
    loadStatistics();
  }, [id, filters]);

  const loadExamData = async () => {
    try {
      const examData = await examService.getExamById(id);
      setExam(examData);
    } catch (err) {
      setError("Error al cargar el examen");
      console.error(err);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await examService.getExamResults(id, filters);
      setResults(data.results || []);
      setPagination({
        total: data.total || 0,
        pages: data.pages || 0,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError("Error al cargar los resultados");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await examService.getExamStatistics(id);
      setStatistics(stats);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await examService.exportExamResults(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `resultados-examen-${exam?.title || id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Error al exportar los resultados");
      console.error(err);
    }
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const variant = {
      completed: "success",
      in_progress: "warning",
      abandoned: "danger",
    }[status] || "secondary";
    
    const text = {
      completed: "Completado",
      in_progress: "En Progreso",
      abandoned: "Abandonado",
    }[status] || status;

    return <Badge bg={variant}>{text}</Badge>;
  };

  const getScoreBadge = (score, passingScore = 70) => {
    const passed = score >= passingScore;
    return (
      <Badge bg={passed ? "success" : "danger"}>
        {score}% {passed ? "✓" : "✗"}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading && !results.length) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/exams" className="text-decoration-none d-flex align-items-center mb-2">
            <i className="bi bi-arrow-left me-2"></i> Volver a Exámenes
          </Link>
          <h1 className="mb-1">Resultados: {exam?.title}</h1>
          <p className="text-muted">Análisis detallado de resultados y estadísticas</p>
        </div>
        <ButtonGroup>
          <Button variant="success" onClick={() => handleExport("csv")}>
            <i className="bi bi-file-earmark-excel me-2"></i>Exportar CSV
          </Button>
          <Button variant="danger" onClick={() => handleExport("pdf")}>
            <i className="bi bi-file-earmark-pdf me-2"></i>Exportar PDF
          </Button>
        </ButtonGroup>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {/* Información del Examen */}
      {exam && (
        <Card className="mb-4">
          <Card.Body>
            <div className="row">
              <div className="col-md-3">
                <div className="mb-3">
                  <strong className="text-muted d-block">Materia</strong>
                  <span>{exam.subject || "No especificado"}</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <strong className="text-muted d-block">Duración</strong>
                  <span>{exam.duration ? `${exam.duration} minutos` : "Sin límite"}</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <strong className="text-muted d-block">Puntaje Mínimo</strong>
                  <span>{exam.passingScore || 70}%</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <strong className="text-muted d-block">Preguntas</strong>
                  <span>{exam.questionCount || exam.questions?.length || 0}</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="results" title={`Resultados (${pagination.total})`} />
        <Tab eventKey="statistics" title="Estadísticas" />
      </Tabs>

      {/* Contenido de Tabs */}
      {activeTab === "results" && (
        <div>
          {/* Filtros */}
          <Card className="mb-4">
            <Card.Body>
              <div className="row">
                <div className="col-md-4">
                  <Form.Group controlId="statusFilter">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                    >
                      <option value="">Todos</option>
                      <option value="completed">Completado</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="abandoned">Abandonado</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group controlId="limitFilter">
                    <Form.Label>Por página</Form.Label>
                    <Form.Select
                      value={filters.limit}
                      onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number.parseInt(e.target.value), page: 1 }))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Tabla de Resultados */}
          <Card>
            <Card.Body>
              {results.length === 0 ? (
                <Alert variant="info" className="text-center">
                  No hay resultados disponibles
                </Alert>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Puntaje</th>
                          <th>Estado</th>
                          <th>Tiempo</th>
                          <th>Intento</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result) => (
                          <tr key={result.id}>
                            <td>
                              <div className="fw-medium">{result.student?.name || "N/A"}</div>
                              <small className="text-muted">{result.student?.email || "N/A"}</small>
                            </td>
                            <td>
                              {result.status === "completed" ? (
                                getScoreBadge(result.score, exam?.passingScore || 70)
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>{getStatusBadge(result.status)}</td>
                            <td>{result.timeSpent ? formatDuration(result.timeSpent) : "-"}</td>
                            <td>{result.attemptNumber || 1}</td>
                            <td>{formatDate(result.startedAt)}</td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => navigate(`/admin/exams/${id}/results/${result.id}`)}
                              >
                                Ver Detalle
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {pagination.pages > 1 && (
                    <div className="d-flex justify-content-between mt-3">
                      <div>
                        <p className="text-muted">
                          Mostrando {(pagination.currentPage - 1) * filters.limit + 1} a{" "}
                          {Math.min(pagination.currentPage * filters.limit, pagination.total)} de{" "}
                          {pagination.total} resultados
                        </p>
                      </div>
                      <Pagination>
                        <Pagination.First
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.currentPage === 1}
                        />
                        <Pagination.Prev
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                        />
                        {[...Array(pagination.pages)].map((_, index) => {
                          const page = index + 1;
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === pagination.currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        <Pagination.Next
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.pages}
                        />
                        <Pagination.Last
                          onClick={() => handlePageChange(pagination.pages)}
                          disabled={pagination.currentPage === pagination.pages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Tab de Estadísticas */}
      {activeTab === "statistics" && statistics && (
        <div>
          {/* Métricas Generales */}
          <div className="row mb-4">
            <div className="col-md-3">
              <Card>
                <Card.Body className="text-center">
                  <h3 className="text-primary">{statistics.totalAttempts || 0}</h3>
                  <p className="text-muted mb-0">Total Intentos</p>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-3">
              <Card>
                <Card.Body className="text-center">
                  <h3 className="text-success">{statistics.completedAttempts || 0}</h3>
                  <p className="text-muted mb-0">Completados</p>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-3">
              <Card>
                <Card.Body className="text-center">
                  <h3 className="text-info">
                    {statistics.averageScore ? `${statistics.averageScore.toFixed(1)}%` : "0%"}
                  </h3>
                  <p className="text-muted mb-0">Promedio</p>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-3">
              <Card>
                <Card.Body className="text-center">
                  <h3 className="text-warning">
                    {statistics.passRate ? `${statistics.passRate.toFixed(1)}%` : "0%"}
                  </h3>
                  <p className="text-muted mb-0">Tasa Aprobación</p>
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Distribución de Puntajes */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Distribución de Puntajes</h5>
            </Card.Header>
            <Card.Body>
              {statistics.scoreDistribution &&
                Object.entries(statistics.scoreDistribution).map(([range, count]) => (
                  <div key={range} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{range}</span>
                      <span>{count}</span>
                    </div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${(count / (statistics.totalAttempts || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </Card.Body>
          </Card>

          {/* Preguntas Más Difíciles */}
          {statistics.difficultQuestions && statistics.difficultQuestions.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Preguntas Más Difíciles</h5>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Pregunta</th>
                      <th>Dificultad</th>
                      <th>Aciertos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.difficultQuestions.map((question, index) => (
                      <tr key={question.id}>
                        <td>{index + 1}</td>
                        <td>{question.question}</td>
                        <td>{question.difficulty}</td>
                        <td>
                          {question.correctRate ? `${question.correctRate.toFixed(1)}%` : "0%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Tiempo Promedio */}
          <Card>
            <Card.Header>
              <h5>Análisis de Tiempo</h5>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-md-4">
                  <h3 className="text-primary">
                    {statistics.averageTime ? formatDuration(statistics.averageTime) : "0:00"}
                  </h3>
                  <p className="text-muted">Tiempo Promedio</p>
                </div>
                <div className="col-md-4">
                  <h3 className="text-success">
                    {statistics.minTime ? formatDuration(statistics.minTime) : "0:00"}
                  </h3>
                  <p className="text-muted">Tiempo Mínimo</p>
                </div>
                <div className="col-md-4">
                  <h3 className="text-danger">
                    {statistics.maxTime ? formatDuration(statistics.maxTime) : "0:00"}
                  </h3>
                  <p className="text-muted">Tiempo Máximo</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default ExamsResults;