import axios from "axios"

// Crear instancia de axios con configuración base
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
})

// Interceptor para agregar token a las peticiones
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token")
        if (token) {
        config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

// Interceptor para manejar respuestas y errores
API.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Si el token ha expirado, redirigir al login
        if (error.response?.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
        }
        return Promise.reject(error)
    },
)

export default API