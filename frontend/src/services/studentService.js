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
            // 1. Preparar parámetros con validación
            const params = {
            params: {
                ...(filters.search && { search: filters.search }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
                ...(filters.minScore && { minScore: filters.minScore }),
                ...(filters.maxScore && { maxScore: filters.maxScore }),
                page: Math.max(1, parseInt(filters.page) || 1),
                limit: Math.min(50, Math.max(1, parseInt(filters.limit) || 10))
            }
        };

            // 2. Hacer la petición
            const response = await API.get("/reports/my/reports", params);
            
            // 3. Validación exhaustiva de la respuesta
            if (!response.data || !Array.isArray(response.data.reports)) {
                throw new Error("Respuesta del servidor inválida");
            }

            // Validar estructura mínima esperada
            const isValidResponse = (
                Array.isArray(response.data.reports) && 
                (response.data.pagination === undefined || (
                    typeof response.data.pagination.total === 'number' &&
                    typeof response.data.pagination.pages === 'number'
                ))
            );

            if (!isValidResponse) {
                console.warn("Estructura de respuesta inesperada:", response.data);
                throw new Error("Formato de datos recibido no válido");
            }

            // Normalización de datos
            const normalizedReports = response.data.reports.map(report => ({
                id: report.id,
                contentBreakdown: report.contentBreakdown || {},
                strengths: report.strengths || [],
                weaknesses: report.weaknesses || [],
                recommendations: report.recommendations || [],
                examResult: {
                    id: report.examResult?.id || '',
                    percentage: report.examResult?.percentage || 0,
                    completedAt: report.examResult?.completedAt || report.createdAt,
                    totalScore: report.examResult?.totalScore || 0,
                    totalQuestions: report.examResult?.totalQuestions || 0,
                    exam: {
                        title: report.examResult?.exam?.title || "Examen sin título",
                        description: report.examResult?.exam?.description || ""
                    }
                }
            }));

            // 4. Procesar y devolver datos
            return {
                success: true,
                reports: normalizedReports,
                pagination: response.data.pagination || {
                    total: normalizedReports.length,
                    pages: 1,
                    currentPage: params.params.page,
                    limit: params.params.limit
                },
                stats: response.data.stats || {
                    totalReports: normalizedReports.length,
                    averageScore: normalizedReports.reduce((acc, r) => acc + (r.examResult?.percentage || 0), 0) / Math.max(1, normalizedReports.length),
                    bestScore: Math.max(...normalizedReports.map(r => r.examResult?.percentage || 0), 0)
                }
            };

        } catch (error) {
            console.error("Error en getMyReports:", {
                error: error.message,
                stack: error.stack,
                response: error.response?.data
            });

            // Determinar tipo de error
            const errorType = !error.response ? "network" :
                                error.response.status === 404 ? "not-found" :
                                "server";

            return {
                success: false,
                error: error.response?.data?.error || error.message || "Error al obtener reportes",
                errorType,
                reports: [],
                pagination: {
                    total: 0,
                    pages: 0,
                    currentPage: Number(filters.page) || 1,
                    limit: Number(filters.limit) || 10
                },
                // No devolver stats en caso de error para evitar confusión
                stats: undefined
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
            // Validación básica del ID
            if (!examResultId || typeof examResultId !== 'string') {
                throw new Error('ID de resultado de examen no válido');
            }

            console.log(`[studentService] Iniciando generación de reporte para examResultId: ${examResultId}`);
            
            const response = await API.post(`/reports/generate/${examResultId}`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    
                },
                timeout: 30000, // 30 segundos de timeout
            });

            if (!response.data) {
                throw new Error('La respuesta del servidor no contiene datos');
            }

            console.log('[studentService] Reporte generado exitosamente:', response.data.report.id);
            return {
                success: true,
                report: response.data.report,
                message: response.data.message || 'Reporte generado exitosamente'
            };
        } catch (error) {
            console.error('[studentService] Error generando reporte:', error);
            
            // Personalizar mensajes de error según el tipo de error
            let errorMessage = 'Error al generar el reporte';
            if (error.response) {
                // Error de respuesta del servidor (4xx, 5xx)
                errorMessage = error.response.data?.error || `Error del servidor: ${error.response.status}`;
            } else if (error.request) {
                // Error de conexión (no se recibió respuesta)
                errorMessage = 'No se pudo conectar con el servidor';
            } else if (error.message) {
                // Error lanzado manualmente
                errorMessage = error.message;
            }

            // Puedes agregar más lógica aquí, como enviar el error a un servicio de monitoreo
            
            throw {
                success: false,
                message: errorMessage,
                code: error.response?.status || 500,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    },

    checkExistingReport: async (examResultId) => {
        try {
            const response = await API.get(`/reports/check/${examResultId}`);
            return { exists: response.data.exists };
        } catch (error) {
            console.error("Error checking report:", error);
            return { exists: false };
        }
    },

    // Obtener reporte específico
    getReport: async (identifier) => {
        try {
            // Validación del identificador
            if (!identifier || typeof identifier !== 'string') {
                throw new Error('Identificador de reporte no válido');
            }

            const response = await API.get(`/reports/${identifier}`);
            
            if (!response.data?.report) {
                throw new Error('Estructura de respuesta inválida');
            }

            return response.data;
        } catch (error) {
            console.error(`Error obteniendo reporte ${identifier}:`, error);
            throw error;
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