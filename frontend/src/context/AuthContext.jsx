import {createContext, useContext, useState, useEffect} from "react"
import API from "../config/axios"

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if(!context) {
        throw new Error("useAuth debe ser usado dentro de AuthProvider")
    }
    return context
}

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    //Verificar si hay un usuario logueado al cargar la app
    useEffect(() => {checkAuth()}, [])

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem("token")
            const userData = localStorage.getItem("user")

            if (token && userData) {
                //Verificar que el token siga siendo válido
                const response = await API.get("/auth/verify")
                if (response.data.valid) {
                    setUser(JSON.parse(userData))
                    setIsAuthenticated(true)
                } else {
                    logout()
                }
            }
        } catch (error) {
            console.error("Error verificando autenticación:", error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            const response = await API.post("/auth/login", {email, password})
            const {token, user: userData} = response.data

            //Guardar en localStorage
            localStorage.setItem("token", token)
            localStorage.setItem("user", JSON.stringify(userData))

            //Actualizar estado
            setUser(userData)
            setIsAuthenticated(true)

            return {success: true, user: userData}
        } catch (error) {
            console.error("Error en login:", error)
            return {
                success: false,
                error: error.response?.data?.error || "Error al iniciar sesión"
            }
        }
    }

    const register = async (userData) => {
        try {
            const response = await API.post("/auth/register", userData)
            const { token, user: newUser } = response.data

            //Guardar en localStorage
            localStorage.setItem("token", token)
            localStorage.setItem("user", JSON.stringify(newUser))

            //Actualizar estado
            setUser(newUser)
            setIsAuthenticated(true)

            return { success: true, user: newUser }
        } catch (error) {
            console.error("Error en registro:", error)
            return {
                success: false,
                error: error.response?.data?.error || "Error al registrarse"
            }
        }
    }

    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setUser(null)
        setIsAuthenticated(false)
    }

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        checkAuth,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}