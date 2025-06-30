import { useState } from "react"
import { Navbar, Nav, Container, Dropdown, Offcanvas, Button } from "react-bootstrap"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Layout = ({ children }) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [showSidebar, setShowSidebar] = useState(false)

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const isAdmin = user?.role === "ADMIN"
    const isStudent = user?.role === "STUDENT"

    const adminMenuItems = [
        { path: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
        { path: "/admin/professors", label: "Profesores", icon: "👨‍🏫" },
        { path: "/admin/questions", label: "Preguntas", icon: "❓" },
        { path: "/admin/exams", label: "Exámenes", icon: "📝" },
        { path: "/admin/students", label: "Estudiantes", icon: "👥" },
        { path: "/admin/reports", label: "Reportes", icon: "📊" },
        { path: "/admin/settings", label: "Configuración", icon: "⚙️" },
    ]

    const studentMenuItems = [
        { path: "/student/dashboard", label: "Dashboard", icon: "🏠" },
        { path: "/student/exam", label: "Exámenes", icon: "📝" },
        { path: "/student/reports", label: "Mis Reportes", icon: "📊" },
        { path: "/student/profile", label: "Mi Perfil", icon: "👤" },
    ]

    const menuItems = isAdmin ? adminMenuItems : studentMenuItems

    return (
        <>
        {/* Navbar */}
        <Navbar bg="primary" variant="dark" expand="lg" className="mb-0">
            <Container fluid>
            <Button
                variant="outline-light"
                className="d-lg-none me-2"
                onClick={() => setShowSidebar(true)}
                aria-label="Abrir menú"
            >
                ☰
            </Button>

            <Navbar.Brand as={Link} to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} className="fw-bold">
                ExamPass
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="d-none d-lg-flex me-auto">
                {menuItems.map((item) => (
                    <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className={location.pathname === item.path ? "active fw-bold" : ""}
                    >
                    {item.icon} {item.label}
                    </Nav.Link>
                ))}
                </Nav>

                <Nav className="ms-auto">
                <Dropdown align="end">
                    <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                    👤 {user?.name || user?.email}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                        Mi Perfil
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                        Cerrar Sesión
                    </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                </Nav>
            </Navbar.Collapse>
            </Container>
        </Navbar>

        {/* Sidebar para móviles */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
            <Offcanvas.Header closeButton>
            <Offcanvas.Title>ExamPass</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
            <Nav className="flex-column">
                {menuItems.map((item) => (
                <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className={`mb-2 ${location.pathname === item.path ? "active fw-bold" : ""}`}
                    onClick={() => setShowSidebar(false)}
                >
                    {item.icon} {item.label}
                </Nav.Link>
                ))}
            </Nav>
            </Offcanvas.Body>
        </Offcanvas>

        {/* Contenido principal */}
        <main className="bg-light min-vh-100">
            <Container fluid className="py-4">
            {children}
            </Container>
        </main>
        </>
    )
}

export default Layout