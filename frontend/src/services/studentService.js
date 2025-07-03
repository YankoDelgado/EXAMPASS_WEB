import API from "../config/axios"

export const studentService = {
    // Obtener dashboard del estudiante
    getDashboardData: async () => {
        try {
            const response = await API.get("/student/dashboard")
            return response.data
        } catch (error) {
            console.error("Error obteniendo datos del dashboard:", error)
            throw error
        }
    },

    // Obtener exámenes disponibles
    getAvailableExams: async () => {
        try {
            const response = await API.get("/exams/available")
            if (!response.data.exam && response.data.message) {
                return { exam: null, message: response.data.message };
            }
            return response.data
        } catch (error) {
            console.error("Error obteniendo exámenes disponibles:", error)
            throw error
        }
    },

    // Obtener mis reportes
    getMyReports: async () => {
        try {
            const response = await API.get("/reports/my/reports")
            return response.data
        } catch (error) {
            console.error("Error obteniendo reportes:", error)
            throw error
        }
    },

    // Obtener mi último resultado
    getLastResult: async () => {
        try {
            const response = await API.get("/student/last-result")
            return response.data
        } catch (error) {
            console.error("Error obteniendo último resultado:", error)
            return null
        }
    },

    // Generar reporte después del examen
    generateReport: async (examResultId) => {
        try {
            const response = await API.post(`/reports/generate/${examResultId}`)
            return response.data
        } catch (error) {
            console.error("Error generando reporte:", error)
            throw error
        }
    },

    // Obtener reporte específico
    getReport: async (reportId) => {
        try {
            const response = await API.get(`/reports/${reportId}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo reporte:", error)
            throw error
        }
    },

    // Obtener historial de exámenes
    getExamHistory: async () => {
        try {
            const response = await API.get("/student/exam-history")
            return response.data
        } catch (error) {
            console.error("Error obteniendo historial:", error)
            throw error
        }
    },

    // Obtener estadísticas personales
    getPersonalStats: async () => {
        try {
            const response = await API.get("/student/statistics")
            return response.data
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error)
            throw error
        }
    },
}