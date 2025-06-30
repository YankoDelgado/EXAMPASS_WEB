import API from "../config/axios"

export const professorService = {
    //Obtener todos los profesores
    getAll: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams()

            if (params.search) queryParams.append("search", params.search)
            if (params.subject) queryParams.append("subject", params.subject)
            if (params.page) queryParams.append("page", params.page)
            if (params.limit) queryParams.append("limit", params.limit)

            const url = queryParams.toString() ? `/professors?${queryParams}` : "/professors"
            const response = await API.get(url)
            return response.data
        } catch (error) {
            console.error("Error obteniendo profesores:", error)
            throw error
        }
    },

    //Obtener profesor por ID
    getById: async (id) => {
        try {
            const response = await API.get(`/professors/${id}`)
            return response.data
        } catch (error) {
            console.error("Error obteniendo profesor:", error)
            throw error
        }
    },

    //Crear nuevo profesor
    create: async (professorData) => {
        try {
            const response = await API.post("/professors", professorData)
            return response.data
        } catch (error) {
            console.error("Error creando profesor:", error)
            throw error
        }
    },

    //Actualizar profesor
    update: async (id, professorData) => {
        try {
            const response = await API.put(`/professors/${id}`, professorData)
            return response.data
        } catch (error) {
            console.error("Error actualizando profesor:", error)
            throw error
        }
    },

    //Eliminar profesor
    delete: async (id) => {
        try {
            const response = await API.delete(`/professors/${id}`)
            return response.data
        } catch (error) {
            console.error("Error eliminando profesor:", error)
            throw error
        }
    },

    //Obtener materias únicas (para filtros)
    getSubjects: async () => {
        try {
            const response = await API.get("/professors/subjects")
            return response.data
        } catch (error) {
            console.error("Error obteniendo materias:", error)
            return { subjects: [] }
        }
    },
}