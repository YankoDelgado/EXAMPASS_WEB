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
                    search: filters.search || undefined,
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined,
                    minScore: Number.isNaN(Number(filters.minScore)) ? undefined : Number(filters.minScore),
                    maxScore: Number.isNaN(Number(filters.maxScore)) ? undefined : Number(filters.maxScore),
                    page: Math.max(1, Number(filters.page) || 1),
                    limit: Math.min(50, Math.max(1, Number(filters.limit) || 10))
                }
            };

            // 2. Hacer la petición
            const response = await API.get("/reports/my/reports", params);
            
            // 3. Validación exhaustiva de la respuesta
            if (!response.data) {
                throw new Error("El servidor no devolvió datos");
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

            // 4. Procesar y devolver datos
            return {
                success: true,
                reports: response.data.reports,
                pagination: {
                    total: response.data.pagination?.total || response.data.reports.length,
                    pages: response.data.pagination?.pages || 1,
                    currentPage: response.data.pagination?.currentPage || params.params.page,
                    limit: response.data.pagination?.limit || params.params.limit
                },
                // Solo incluir stats si viene en la respuesta
                ...(response.data.stats && { stats: response.data.stats })
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