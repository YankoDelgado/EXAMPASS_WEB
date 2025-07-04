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
    getMyReports: async (filters = {}) => {
        try {
            const params = {
                params: {
                    search: filters.search,
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    minScore: filters.minScore,
                    maxScore: filters.maxScore,
                    page: Number(filters.page) || 1,
                    limit: Number(filters.limit) || 10
                }
            };

            const response = await API.get("/reports/my/reports", params);
            
            if (!response.data) {
                throw new Error("Estructura de respuesta inválida");
            }

            return {
                success: true,
                reports: response.data.reports || [],
                pagination: response.data.pagination || {
                    total: 0,
                    pages: 0,
                    currentPage: 1,
                    limit: 10
                },
                stats: response.data.stats || {
                    totalReports: 0,
                    averageScore: 0,
                    bestScore: 0,
                    lastExamDate: null,
                    improvementTrend: "stable"
                }
            };
        } catch (error) {
            console.error("Error obteniendo reportes:", error);
            return {
                success: false,
                reports: [],
                pagination: {
                    total: 0,
                    pages: 0,
                    currentPage: 1,
                    limit: 10
                },
                stats: {
                    totalReports: 0,
                    averageScore: 0,
                    bestScore: 0,
                    lastExamDate: null,
                    improvementTrend: "stable"
                },
                error: error.response?.data?.error || "Error al obtener reportes"
            };
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
            const response = await API.get("/reports/my/reports", {
                params: { page: 1, limit: 1 }
            });
            
            if (!response.data?.stats) {
                throw new Error("Estructura de respuesta inválida");
            }

            return {
                success: true,
                stats: response.data.stats
            };
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error);
            return {
                success: false,
                stats: {
                    totalReports: 0,
                    averageScore: 0,
                    bestScore: 0,
                    lastExamDate: null,
                    improvementTrend: "stable"
                },
                error: error.response?.data?.error || "Error al obtener estadísticas"
            };
        }
    }
}