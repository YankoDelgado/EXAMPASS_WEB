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
            const response = await API.get("/exams/my-results")
            return response.data.lastResult
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
            const response = await API.get("/reports/my/reports");
            
            // Asegurar estructura consistente incluso si hay errores en el backend
            if (!response.data?.stats) {
                throw new Error("Estructura de respuesta inválida");
            }

            return {
                success: true,
                stats: {
                    totalReports: response.data.stats.totalReports || 0,
                    averageScore: response.data.stats.averageScore || 0,
                    bestScore: response.data.stats.bestScore || 0,
                    lastExamDate: response.data.stats.lastExamDate || null,
                    improvementTrend: response.data.stats.improvementTrend || "stable",
                    subjectPerformance: response.data.stats.subjectPerformance || [],
                    lastExam: response.data.stats.lastExam || {
                        score: 0,
                        correctAnswers: 0,
                        totalQuestions: 0,
                        strengths: [],
                        weaknesses: [],
                        recommendations: [],
                        professor: null
                    }
                }
            };
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error);
            
            // Devuelve una estructura vacía pero consistente
            return {
                success: false,
                stats: {
                    totalReports: 0,
                    averageScore: 0,
                    bestScore: 0,
                    lastExamDate: null,
                    improvementTrend: "stable",
                    subjectPerformance: [],
                    lastExam: {
                        score: 0,
                        correctAnswers: 0,
                        totalQuestions: 0,
                        strengths: [],
                        weaknesses: [],
                        recommendations: [],
                        professor: null
                    }
                },
                error: error.response?.data?.error || "Error al obtener estadísticas"
            };
        }
    }
}