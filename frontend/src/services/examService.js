import API from "../config/axios"

export const examService = {
    // Obtener exámenes disponibles para el estudiante
    getAvailableExams: async () => {
        try {
            const response = await API.get("/exams/available")
            return response.data
        } catch (error) {
            console.error("Error obteniendo exámenes disponibles:", error)
            throw error
        }
    },

    // Iniciar un examen
    startExam: async (examId) => {
        try {
            const response = await API.post(`/exams/${examId}/start`)
            return response.data
        } catch (error) {
            console.error("Error iniciando examen:", error)
            throw error
        }
    },

    // Obtener estado actual del examen
    getExamSession: async (examId) => {
        try {
            const response = await API.get(`/exams/${examId}/session`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo sesión del examen:", error)
            throw error
        }
    },

    // Guardar respuesta de una pregunta
    saveAnswer: async (examId, questionId, answer) => {
        try {
            const response = await API.post(`/exams/${examId}/answer`, {
                questionId,
                answer,
            })
            return response.data
        } catch (error) {
            console.error("Error guardando respuesta:", error)
            throw error
        }
    },

    // Enviar examen completo
    submitExam: async (examId) => {
        try {
            const response = await API.post(`/exams/${examId}/submit`)
            return response.data
        } catch (error) {
            console.error("Error enviando examen:", error)
            throw error
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
            const response = await API.get(`/admin/exams?${params}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo todos los exámenes:", error)
            throw error
        }
    },

    // Crear examen (admin)
    createExam: async (examData) => {
        try {
            const response = await API.post("/admin/exams", examData)
            return response.data
        } catch (error) {
            console.error("Error creando examen:", error)
            throw error
        }
    },

    // Obtener examen específico (admin)
    getExamById: async (examId) => {
        try {
            const response = await API.get(`/admin/exams/${examId}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo examen:", error)
            throw error
        }
    },

    // Actualizar examen (admin)
    updateExam: async (examId, examData) => {
        try {
            const response = await API.put(`/admin/exams/${examId}`, examData)
            return response.data
        } catch (error) {
            console.error("Error actualizando examen:", error)
            throw error
        }
    },

    // Eliminar examen (admin)
    deleteExam: async (examId) => {
        try {
            const response = await API.delete(`/admin/exams/${examId}`)
            return response.data
        } catch (error) {
            console.error("Error eliminando examen:", error)
            throw error
        }
    },

    // Obtener estadísticas del examen (admin)
    getExamStats: async (examId) => {
        try {
            const response = await API.get(`/admin/exams/${examId}/stats`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo estadísticas del examen:", error)
            throw error
        }
    },

    // Activar/Desactivar examen (admin)
    toggleExamStatus: async (examId) => {
        try {
            const response = await API.patch(`/admin/exams/${examId}/toggle-status`)
            return response.data
        } catch (error) {
            console.error("Error cambiando estado del examen:", error)
            throw error
        }
    },

    // Duplicar examen (admin)
    duplicateExam: async (examId) => {
        try {
            const response = await API.post(`/admin/exams/${examId}/duplicate`)
            return response.data
        } catch (error) {
            console.error("Error duplicando examen:", error)
            throw error
        }
    },

    // Obtener resultados del examen (admin)
    getExamResults: async (examId, filters = {}) => {
        try {
            const params = new URLSearchParams(filters)
            const response = await API.get(`/admin/exams/${examId}/results?${params}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo resultados del examen:", error)
            throw error
        }
    },
}