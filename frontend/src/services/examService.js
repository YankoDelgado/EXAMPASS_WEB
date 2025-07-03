import API from "../config/axios"

export const examService = {
    // Obtener exámenes disponibles para el estudiante
    getAvailableExams: async (single = false) => {
        try {
            const response = await API.get("/exams/available", {
                params: {single: single}
            })
            if (!response.data.success) {
                return {
                    success: false,
                    exams: [],
                    error: response.data.error || "Error al obtener exámenes",
                    message: response.data.message
                };
            }
            return {
                success: true,
                exams: response.data.data || [],
                message: response.data.message,
                error: null
            };
        } catch (error) {
            console.error("Error obteniendo exámenes disponibles:", error)
            return {
                success: false,
                exams: [],
                error: error.response?.data?.error || "Error de conexión",
                message: error.response?.data?.message || "No se pudo conectar al servidor"
            };
        }
    },

    // Iniciar un examen
    startExam: async (examId) => {
        try {
            const response = await API.post(`/exams/${examId}/start`)

            if (!response.data.examResult) {
                throw new Error(response.data.error || "Error al iniciar el examen");
            }

            return {
                success: true,
                examResult: response.data.examResult
            };
        } catch (error) {
            console.error("Error iniciando examen:", error);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    },

    // Obtener estado actual del examen
    getExamSession: async (examId) => {
        try {
            const response = await API.get(`/exams/${examId}/session`)
            
            if (!response.data.success) {
                throw new Error(response.data.error || "Error al obtener sesión");
            }

            return {
                success: true,
                session: response.data.session
            };
        } catch (error) {
            console.error("Error obteniendo sesión:", error);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    },

    // Guardar respuesta de una pregunta
    saveAnswer: async (examResultId, questionId, answer) => {
        try {
            const response = await API.post(`/exams/results/${examResultId}/answer`, {
                questionId,
                selectedAnswer: answer
            });
            
            return {
                success: true,
                answer: response.data.answer
            };
        } catch (error) {
            console.error("Error guardando respuesta:", error);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    },

    // Enviar examen completo
    submitExam: async (examResultId) => {
        try {
            const response = await API.post(`/exams/results/${examResultId}/finish`);
        
            return {
                success: true,
                result: response.data.result
            };
        } catch (error) {
            console.error("Error enviando examen:", error);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    },

    // Obtener resultado del examen
    getExamResult: async (examResultId) => {
        try {
            const response = await API.get(`/exams/result/${examResultId}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo resultado:", error)
            throw error
        }
    },

    // Generar examen (para admin)
    generateExam: async (examConfig) => {
        try {
            const response = await API.post("/exams/generate", examConfig)
            return response.data
        } catch (error) {
            console.error("Error generando examen:", error)
            throw error
        }
    },

    // Obtener historial de exámenes del estudiante
    getStudentHistory: async () => {
        try {
            const response = await API.get("/student/exam-history")
            return response.data
        } catch (error) {
            console.error("Error obteniendo historial:", error)
            throw error
        }
    },

    // FUNCIONES ADMINISTRATIVAS

    // Obtener todos los exámenes (admin)
    getAllExams: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters)
            const response = await API.get(`/exams?${params}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo todos los exámenes:", error)
            throw error
        }
    },

    // Crear examen (admin)
    createExam: async (examData) => {
        try {
            const response = await API.post("/exams/generate", examData)
            return response.data
        } catch (error) {
            console.error("Error creando examen:", error)
            throw error
        }
    },

    // Obtener examen específico (admin)
    getExamById: async (examId) => {
        try {
            const response = await API.get(`/exams/${examId}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo examen:", error)
            throw error
        }
    },

    // Actualizar examen (admin)
    updateExam: async (examId, examData) => {
        try {
            const response = await API.put(`/exams/${examId}`, examData)
            return response.data
        } catch (error) {
            console.error("Error actualizando examen:", error)
            throw error
        }
    },

    // Eliminar examen (admin)
    deleteExam: async (examId) => {
        try {
            const response = await API.delete(`/exams/${examId}`)
            return response.data
        } catch (error) {
            console.error("Error eliminando examen:", error)
            throw error
        }
    },

    // Obtener estadísticas del examen (admin)
    getExamStats: async (examId) => {
        try {
            const response = await API.get(`/exams/${examId}/stats`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo estadísticas del examen:", error)
            throw error
        }
    },

    // Activar/Desactivar examen (admin)
    toggleExamStatus: async (examId) => {
        try {
            const response = await API.patch(`/exams/${examId}/toggle-status`)
            return response.data
        } catch (error) {
            console.error("Error cambiando estado del examen:", error)
            throw error
        }
    },

    // Obtener resultados del examen (admin)
    getExamResults: async (examId, filters = {}) => {
        try {
            const params = new URLSearchParams(filters)
            const response = await API.get(`/exams/${examId}/results?${params}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo resultados del examen:", error)
            throw error
        }
    },
}