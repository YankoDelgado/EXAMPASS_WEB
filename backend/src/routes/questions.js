import express from "express"
import {prisma} from "../lib/prisma.js"
import {authenticateToken,requireAdmin} from "../middleware/auth.js"

const router = express.Router()

//Obtener todas las preguntas
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { search, professor, indicator, isActive, page = 1, limit = 10 } = req.query
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        //Construir filtros dinámicos
        const where = {}

        if(search) {
            where.OR = [
                { header: { contains: search, mode: "insensitive" } },
                { educationalIndicator: { contains: search, mode: "insensitive" } }
            ];
        }

        if (professor) {
            where.professorId = professor;
        }

        if (indicator) {
            where.educationalIndicator = {
                contains: indicator,
                mode: "insensitive"
            };
        }

        if(isActive !== undefined) {
            where.isActive = isActive === "true"
        }

        const total = await prisma.question.count({ where });

        const questions = await prisma.question.findMany({
            where,
            include: {
                professor: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limitNumber
        });

        res.json({
            questions,
            total,
            pages: Math.ceil(total / limitNumber),
            currentPage: pageNumber,
            filters: { search, professor, indicator, isActive },
        });
    } catch (error) {
        console.error("Error obteniendo preguntas:", error)
        res.status(500).json({error: "Error interno del servidor"})
    }
})

// Obtener indicadores educativos únicos
router.get("/indicators", authenticateToken, async (req, res) => {
    try {
        const indicators = await prisma.question.findMany({
            where: {
                educationalIndicator: { not: null } // Solo indicadores no nulos
            },
            distinct: ['educationalIndicator'],
            select: {
                educationalIndicator: true
            },
            orderBy: {
                educationalIndicator: 'asc'
            }
        });

        // Extraemos solo los valores de los indicadores
        const indicatorValues = indicators.map(item => item.educationalIndicator);

        res.json({
            success: true,
            indicators: indicatorValues
        });
    } catch (error) {
        console.error("Error obteniendo indicadores:", error);
        res.status(500).json({ 
            success: false,
            error: "Error al obtener los indicadores educativos" 
        });
    }
});

//Obtener una pregunta por ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const {id} = req.params

        const question = await prisma.question.findUnique({
            where: {id},
            include: {
                professor: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    }
                }
            }
        })

        if(!question) {
            return res.status(404).json({error:"Pregunta no encontrada"})
        }

        res.json(question)
    } catch (error) {
        console.error("Error obteniendo pregunta:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Crear nueva pregunta (solo admins)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {header, alternatives, correctAnswer, educationalIndicator, professorId} = req.body

        console.log("Creando pregunta:", {header, professorId, educationalIndicator})

        if(!header || !alternatives || correctAnswer === undefined || !educationalIndicator || !professorId) {
            return res.status(400).json({error:"Todos los campos son requeridos: encabezado, alternativas, respuesta correcta, contenido, Profesor"})
        }

        //Validar que alternatives sea un array de 4 elementos
        if(!Array.isArray(alternatives) || alternatives.length !== 4) {
            return res.status(400).json({error: "Debe proporcionar exactamente 4 alternativas"})
        }

        // Validar que todas las alternativas tengan contenido
        const emptyAlternatives = alternatives.some((alt, index) => !alt || alt.trim().length === 0)

        if(emptyAlternatives) {
            return res.status(400).json({error:"Todas las alternativas deben tener contenido"})
        }

        // Validar respuesta correcta
        if(correctAnswer < 0 || correctAnswer > 3) {
            return res.status(400).json({error:"La respuesta correcta debe ser un índice entre 0 y 3"})
        }

        // Validar que el profesor existe
        const professor = await prisma.professor.findUnique({where: {id: professorId}})

        if(!professor) {
            return res.status(404).json({error:"Profesor no encontrado"})
        }

        // Crear pregunta
        const question = await prisma.question.create({
            data: {
                header: header.trim(),
                alternatives: alternatives.map((alt) => alt.trim()),
                correctAnswer,
                educationalIndicator: educationalIndicator.trim(),
                professorId
            },
            include: {
                professor: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    },
                },
            },
        })

        console.log("Pregunta creada:", {id: question.id, header: question.header})

        res.status(201).json({
            message: "Pregunta creada exitosamente",
            question
        })
    } catch (error) {
        console.error("Error creando pregunta:", error)
        res.status(500).json({
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        })
    }
})

//Actualizar pregunta (solo admins)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {id} = req.params
        const {header, alternatives, correctAnswer, educationalIndicator, professorId, isActive} = req.body

        console.log("Actualizando pregunta:", {id, header})

        //Verificar que la pregunta existe
        const existingQuestion = await prisma.question.findUnique({where: {id}})

        if(!existingQuestion) {
            return res.status(404).json({error:"Pregunta no encontrada"})
        }

        //Validaciones (solo si se proporcionan los campos)
        if(alternatives && (!Array.isArray(alternatives) || alternatives.length !== 4)) {
            return res.status(400).json({error:"Debe proporcionar exactamente 4 alternativas"})
        }

        if(correctAnswer !== undefined && (correctAnswer < 0 || correctAnswer > 3)) {
            return res.status(400).json({error: "La respuesta correcta debe ser un índice entre 0 y 3"})
        }

        if(professorId) {
            const professor = await prisma.professor.findUnique({where:{id: professorId}})

            if(!professor) {
                return res.status(404).json({error:"Profesor no encontrado"})
            }
        }

        //Construir datos para actualizar
        const updateData = {}

        if(header) updateData.header = header.trim()
        if(alternatives) updateData.alternatives = alternatives.map((alt) => alt.trim())
        if(correctAnswer !== undefined) updateData.correctAnswer = correctAnswer
        if(educationalIndicator) updateData.educationalIndicator = educationalIndicator.trim()
        if(professorId) updateData.professorId = professorId
        if(isActive !== undefined) updateData.isActive = isActive

        //Actualizar pregunta
        const updatedQuestion = await prisma.question.update({
            where: {id},
            data: updateData,
            include: {
                professor: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                    }
                }
            }
        })

        console.log("Pregunta actualizada:", {id: updatedQuestion.id, header: updatedQuestion.header})

        res.json({
            message: "Pregunta actualizada exitosamente",
            question: updatedQuestion,
        })
    } catch (error) {
        console.error("Error actualizando pregunta:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Eliminar pregunta (solo admins)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {id} = req.params

        console.log("Eliminando pregunta:", {id})

        //Verificar que la pregunta existe
        const existingQuestion = await prisma.question.findUnique({
            where: {id},
            include: {
                professor: {
                    select: {
                        name: true,
                        subject: true,
                    }
                },
                _count: {
                    select: {
                        examAnswers: true,
                    }
                }
            }
        })

        if(!existingQuestion) {
            return res.status(404).json({error:"Pregunta no encontrada"})
        }

        //Verificar si la pregunta ha sido respondida en exámenes
        if(existingQuestion._count.examAnswers > 0) {
            return res.status(400).json({
                error: `No se puede eliminar la pregunta porque ha sido respondida en ${existingQuestion._count.examAnswers} examen(es)`,
                examAnswersCount: existingQuestion._count.examAnswers
            })
        }

        //Eliminar pregunta
        await prisma.question.delete({where: {id}})

        console.log("Pregunta eliminada:", {id, header: existingQuestion.header})

        res.json({
            message: "Pregunta eliminada exitosamente",
            deletedQuestion: {
                id: existingQuestion.id,
                header: existingQuestion.header,
                professor: existingQuestion.professor
            }
        })
    } catch (error) {
        console.error("Error eliminando pregunta:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Activar/Desactivar pregunta (solo admins)
router.patch("/:id/toggle", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {id} = req.params

        const existingQuestion = await prisma.question.findUnique({where: {id}})

        if(!existingQuestion) {
            return res.status(404).json({error:"Pregunta no encontrada"})
        }

        const updatedQuestion = await prisma.question.update({
            where: {id},
            data: {
                isActive: !existingQuestion.isActive
            },
            include: {
                professor: {
                    select: {
                        name: true,
                        subject: true,
                    }
                }
            }
        })

        console.log(`Pregunta ${updatedQuestion.isActive ? "activada" : "desactivada"}:`, {id, header: updatedQuestion.header})

        res.json({
            message: `Pregunta ${updatedQuestion.isActive ? "activada" : "desactivada"} exitosamente`,
            question: updatedQuestion,
        })
    } catch (error) {
        console.error("Error cambiando estado de pregunta:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

export default router