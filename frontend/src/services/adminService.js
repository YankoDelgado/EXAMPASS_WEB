import API from "../config/axios"

export const adminService = {
    //Obtener estadísticas del dashboard
    getDashboardStats: async () => {
        try {
            const response = await API.get("/reports/admin/statistics")
            return response.data
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error)
            throw error
        }
    },

    //Obtener resumen de profesores
    getProfessorsOverview: async () => {
        try {
            const response = await API.get("/professors")
            return response.data
        } catch (error) {
            console.error("Error obteniendo profesores:", error)
            throw error
        }
    },

    //Obtener resumen de estudiantes
    getStudentsOverview: async () => {
        try {
            const response = await API.get("/auth/users?role=STUDENT")
            return response.data
        } catch (error) {
            console.error("Error obteniendo estudiantes:", error)
            throw error
        }
    },

    //Obtener exámenes recientes
    getRecentExams: async () => {
        try {
            const response = await API.get("/exams?limit=5")
            return response.data
        } catch (error) {
            console.error("Error obteniendo exámenes:", error)
            throw error
        }
    },
}