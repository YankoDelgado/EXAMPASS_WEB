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
            const response = await API.get(`/questions/${id}`, {
                params: {
                    includeStats: true 
                }
            });

            if (!response.data) {
            throw new Error("La respuesta del servidor no contiene datos");
        }
        
        // Asegurar que la pregunta existe en la respuesta
        if (!response.data.question) {
            throw new Error("Pregunta no encontrada en la respuesta");
        }
        
        return {
            question: response.data.question,
            stats: response.data.stats || {
                timesUsed: 0,
                correctRate: 0,
                lastUsed: null
            }
        };
        } catch (error) {
            console.error("Error obteniendo pregunta:", error)
            throw error
        }
    },

    // Crear nueva pregunta
    create: async (questionData) => {
        try {
            const response = await API.post("/questions", questionData)
            // Verificar respuesta exitosa
            if (response.data && response.data.success !== false) {
                return response.data;
            }
        
            // Si la respuesta indica error
            throw new Error(response.data?.error || "Error desconocido al crear pregunta");
        } catch (error) {
            console.error("Error creando pregunta:", {
                error: error.response?.data || error.message,
                questionData
            });
        
            const errorMessage = error.response?.data?.error 
                || error.response?.data?.message 
                || "Error creando pregunta. Verifica los datos e intenta nuevamente.";
                
            throw new Error(errorMessage);
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
