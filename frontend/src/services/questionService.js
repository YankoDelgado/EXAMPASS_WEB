import API from "../config/axios"

export const questionService = {
    // Obtener todas las preguntas
    getAll: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams()

            if (params.search) queryParams.append("search", params.search)
            if (params.professor) queryParams.append("professor", params.professor)
            if (params.indicator) queryParams.append("indicator", params.indicator)

            if (params.isActive !== undefined && params.isActive !== "") queryParams.append("isActive", params.isActive)

            queryParams.append("page", params.page||1)
            queryParams.append("limit", params.limit||10)

            const url = queryParams.toString() ? `/questions?${queryParams}` : "/questions"
            a
            const response = await API.get(url)
            return response.data
        } catch (error) {
            console.error("Error obteniendo preguntas:", error)
            throw error
        }
    },

    // Obtener pregunta por ID
    getById: async (id) => {
        try {
            const response = await API.get(`/questions/${id}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo pregunta:", error)
            throw error
        }
    },

    // Crear nueva pregunta
    create: async (questionData) => {
        try {
            const response = await API.post("/questions", questionData)
            return response.data
        } catch (error) {
            console.error("Error creando pregunta:", error)
            throw error
        }
    },

    // Actualizar pregunta
    update: async (id, questionData) => {
        try {
            const response = await API.put(`/questions/${id}`, questionData)
            return response.data
        } catch (error) {
            console.error("Error actualizando pregunta:", error)
            throw error
        }
    },

    // Eliminar pregunta
    delete: async (id) => {
        try {
            const response = await API.delete(`/questions/${id}`)
            return response.data
        } catch (error) {
            console.error("Error eliminando pregunta:", error)
            throw error
        }
    },

    // Obtener indicadores educativos únicos
    getEducationalIndicators: async () => {
        try {
            const response = await API.get("/questions/indicators")
            return response.data
        } catch (error) {
            console.error("Error obteniendo indicadores:", error)
            return { indicators: [] }
        }
    },

    // Validar pregunta antes de guardar
    validate: async (questionData) => {
        try {
            const response = await API.post("/questions/validate", questionData)
            return response.data
        } catch (error) {
            console.error("Error validando pregunta:", error)
            throw error
        }
    },
}
