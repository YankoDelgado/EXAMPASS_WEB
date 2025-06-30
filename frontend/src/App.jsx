import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"

// Componentes base
import PrivateRoute from "./components/PrivateRoute"
import Layout from "./components/Layout"

// Páginas de autenticación
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

// Páginas de Admin
import AdminDashboard from "./pages/admin/Dashboard"
import ProfessorsList from "./pages/admin/professors/ProfessorsList"
import ProfessorsCreate from "./pages/admin/professors/ProfessorsCreate"
import ProfessorsEdit from "./pages/admin/professors/ProfessorsEdit"
import ProfessorsView from "./pages/admin/professors/ProfessorsView"
import QuestionsList from "./pages/admin/questions/QuestionsList"
import QuestionsCreate from "./pages/admin/questions/QuestionsCreate"
import QuestionsEdit from "./pages/admin/questions/QuestionsEdit"
import QuestionsView from "./pages/admin/questions/QuestionsView"
import ExamsList from "./pages/admin/exams/ExamsList"
import ExamsCreate from "./pages/admin/exams/ExamsCreate"
import ExamsView from "./pages/admin/exams/ExamsView"
import ExamResults from "./pages/admin/exams/ExamResults"
import AdminReports from "./pages/admin/reports/AdminReports"
import AdminStatistics from "./pages/admin/reports/AdminStatistics"
import StudentReport from "./pages/admin/reports/StudentReport"
import StudentsList from "./pages/admin/students/StudentsList"
import StudentsView from "./pages/admin/students/StudentsView"
import AdminSettings from "./pages/admin/AdminSettings"

// Páginas de Estudiante
import StudentDashboard from "./pages/student/Dashboard"
import StudentOnboarding from "./pages/student/StudentOnboarding"
import ExamAvailable from "./pages/student/exam/ExamAvailable"
import ExamTaking from "./pages/student/exam/ExamTaking"
import ExamResult from "./pages/student/exam/ExamResult"
import StudentReports from "./pages/student/reports/StudentReports"
import StudentReportView from "./pages/student/reports/StudentReportView"
import StudentProfile from "./pages/student/StudentProfile"

// Páginas compartidas
import UserProfile from "./pages/shared/UserProfile"

// Páginas de error
import Unauthorized from "./pages/Unauthorized"
import NotFound from "./pages/NotFound"

// Spinner de carga
import { Spinner, Container } from "react-bootstrap"

function App() {
  const { loading, isAuthenticated, user } = useAuth()

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    )
  }

  return (
    <Routes>
      {/* =================== RUTAS PÚBLICAS =================== */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <Login />
          ) : (
            <Navigate to={user?.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"} />
          )
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? (
            <Register />
          ) : (
            <Navigate to={user?.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"} />
          )
        }
      />

      {/* =================== RUTAS ADMIN =================== */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute requiredRole="ADMIN">
            <Layout>
              <Routes>
                {/* Dashboard Principal */}
                <Route path="dashboard" element={<AdminDashboard />} />

                {/* CRUD Profesores */}
                <Route path="professors" element={<ProfessorsList />} />
                <Route path="professors/create" element={<ProfessorsCreate />} />
                <Route path="professors/edit/:id" element={<ProfessorsEdit />} />
                <Route path="professors/:id" element={<ProfessorsView />} />

                {/* CRUD Preguntas */}
                <Route path="questions" element={<QuestionsList />} />
                <Route path="questions/create" element={<QuestionsCreate />} />
                <Route path="questions/edit/:id" element={<QuestionsEdit />} />
                <Route path="questions/:id" element={<QuestionsView />} />

                {/* Gestión de Exámenes */}
                <Route path="exams" element={<ExamsList />} />
                <Route path="exams/create" element={<ExamsCreate />} />
                <Route path="exams/:id" element={<ExamsView />} />
                <Route path="exams/:id/results" element={<ExamResults />} />

                {/* Reportes y Estadísticas */}
                <Route path="reports" element={<AdminReports />} />
                <Route path="reports/statistics" element={<AdminStatistics />} />
                <Route path="reports/student/:userId" element={<StudentReport />} />

                {/* Gestión de Estudiantes */}
                <Route path="students" element={<StudentsList />} />
                <Route path="students/:id" element={<StudentsView />} />

                {/* Configuración */}
                <Route path="settings" element={<AdminSettings />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />

      {/* =================== RUTAS ESTUDIANTE =================== */}
      <Route
        path="/student/*"
        element={
          <PrivateRoute requiredRole="STUDENT">
            <Layout>
              <Routes>
                {/* Dashboard Principal */}
                <Route path="dashboard" element={<StudentDashboard />} />

                {/* Onboarding */}
                <Route path="onboarding" element={<StudentOnboarding />} />

                {/* Sistema de Exámenes */}
                <Route path="exam" element={<ExamAvailable />} />
                <Route path="exam/:examId" element={<ExamTaking />} />
                <Route path="exam/:examId/result" element={<ExamResult />} />

                {/* Reportes del Estudiante */}
                <Route path="reports" element={<StudentReports />} />
                <Route path="reports/:reportId" element={<StudentReportView />} />

                {/* Perfil */}
                <Route path="profile" element={<StudentProfile />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />

      {/* =================== RUTAS COMPARTIDAS =================== */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <UserProfile />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* =================== RUTAS DE ERROR =================== */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />

      {/* =================== REDIRECCIONES =================== */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Ruta catch-all */}
      <Route path="*" element={<Navigate to="/404" />} />
    </Routes>
  )
}

export default App
