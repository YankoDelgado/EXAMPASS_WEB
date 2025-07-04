import express from "express"
import {prisma} from "../lib/prisma.js"
import { authenticateToken, requireAdmin, requireStudent } from "../middleware/auth.js"

const router = express.Router()

//Obtener todos los exámenes (solo admins)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const exams = await prisma.exam.findMany({
            include: {
                examResults: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        examResults: true,
                        examQuestions: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        res.json({exams,total: exams.length})
    } catch (error) {
        console.error("Error obteniendo exámenes:", error)
        res.status(500).json({error: "Error interno del servidor"})
    }
})

//Generar nuevo examen (solo admins)
router.post("/generate", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            questionIds, 
            status,
            timeLimit = null
        } = req.body;

        // Validaciones básicas
        if (!title || !title.trim()) {
            return res.status(400).json({ error: "El título del examen es requerido" });
        }

        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ error: "Debe seleccionar al menos una pregunta" });
        }

        if (questionIds.length > 10) {
            return res.status(400).json({ error: "El número máximo de preguntas permitidas es 10" });
        }

        console.log("Creando nuevo examen manual:", { 
            title, 
            questionCount: questionIds.length,
            status
        });

        // Verificar que todas las preguntas existan y estén activas
        const questions = await prisma.question.findMany({
            where: {
                id: { in: questionIds },
                isActive: true
            },
            include: {
                professor: {
                    select: {
                        name: true,
                        subject: true
                    }
                }
            }
        });

        if (questions.length !== questionIds.length) {
            const invalidIds = questionIds.filter(id => 
                !questions.some(q => q.id === id));
            
            return res.status(400).json({
                error: "Algunas preguntas no existen o no están activas",
                details: {
                    requested: questionIds.length,
                    found: questions.length,
                    invalidIds
                }
            });
        }

        // Crear el examen en la base de datos
        const exam = await prisma.exam.create({
            data: {
                title: title.trim(),
                description: description?.trim(),
                totalQuestions: questionIds.length,
                status,
                timeLimit: timeLimit === 0 ? null : timeLimit // Guardar null si no hay tiempo límite
            }
        });

        // Crear las relaciones entre el examen y las preguntas
        const examQuestions = await Promise.all(
            questionIds.map((questionId, index) => 
                prisma.examQuestion.create({
                    data: {
                        examId: exam.id,
                        questionId,
                        order: index + 1 
                    }
                })
            )
        );

        console.log("Examen creado exitosamente:", {
            examId: exam.id,
            title: exam.title,
            questionCount: examQuestions.length,
            status: exam.status,
            timeLimit: exam.timeLimit
        });

        // Obtener el examen completo con sus preguntas para la respuesta
        const fullExam = await prisma.exam.findUnique({
            where: { id: exam.id },
            include: {
                examQuestions: {
                    include: {
                        question: {
                            include: {
                                professor: {
                                    select: {
                                        name: true,
                                        subject: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { order: "asc" }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: "Examen creado exitosamente",
            exam: fullExam
        });

    } catch (error) {
        console.error("Error al crear examen manual:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
});

//Obtener examen disponible para estudiante
router.get("/available", authenticateToken, requireStudent, async (req, res) => {
    try {
        const single = req.query.single === "true"

        const baseWhere = {
            status: "ACTIVE",
                examResults: {
                    none: {
                        userId: req.user.id,
                        status: "COMPLETED"
                    }
                }
        }
        const baseInclude = {
            examQuestions: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                header: true,
                                alternatives: true,
                                educationalIndicator: true,
                                professor: {
                                    select: {
                                        name: true,
                                        subject: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { order: "asc" }
                },
                _count: {
                    select: {
                        examQuestions: true
                    }
                }
        }
        if (single){
            const availableExam = await prisma.exam.findFirst({
                where: baseWhere,
                include: baseInclude,
                orderBy: { id: "asc" }
            })

            res.json({
            success: true,
            data: availableExam ? [availableExam] : [],
            message: "Examen disponible encontrado"
        })
        }

        const availableExam = await prisma.exam.findMany({
            where: baseWhere,
            include: baseInclude
        });

        res.json({
            success: true,
            data: availableExam,
            message: "Examens disponibles encontrados"
        })
    } catch (error) {
        console.error("Error obteniendo examen disponible:", error)
        res.status(500).json({
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        })
    }
})

//Iniciar examen (estudiantes)
router.post("/:examId/start", authenticateToken, requireStudent, async (req, res) => {
    try {
        const {examId} = req.params
        const userId = req.user.id;

        console.log("Iniciando examen:", {examId, userId: req.user.id})

        //Verificar que el examen existe y está activo
        const exam = await prisma.exam.findUnique({
            where: {id: examId},
            include: {
                examQuestions: {
                    include: {
                        question: true
                    }
                }
            }
        })

        if(!exam) {
            return res.status(404).json({error: "Examen no encontrado"})
        }

        if(exam.status !== "ACTIVE") {
            return res.status(400).json({error: "El examen no está disponible"})
        }

        //Verificar que el estudiante no haya tomado ya este examen
        const existingResult = await prisma.examResult.findFirst({
            where: {
                userId: userId,
                examId: examId,
                status: "COMPLETED"
            }
        })

        if(existingResult) {
            return res.status(400).json({error:"Ya has tomado este examen"})
        }

        // Buscar si hay una sesión en progreso
        const existingSession = await prisma.examResult.findFirst({
            where: {
                userId: userId,
                examId: examId,
                status: "IN_PROGRESS"
            }
        });

        // Si ya hay una sesión en progreso, devolver esa
        if(existingSession) {
            return res.status(200).json({
                message: "Examen en progreso recuperado",
                examResult: existingSession
            });
        }

        //Crear nueva sesión de examen
        const examResult = await prisma.examResult.create({
            data: {
                userId: req.user.id,
                examId: examId,
                totalQuestions: exam.totalQuestions,
                totalScore: 0,
                percentage: 0,
                status: "IN_PROGRESS",
                createdAt: new Date()
            },
            include: {
                exam: {
                    include: {
                        examQuestions: {
                            include: {
                                question: true
                            }
                        }
                    }
                }
            }
        })

        console.log("Examen iniciado:", {resultId: examResult.id})

        res.status(201).json({
            message: "Examen iniciado exitosamente",
            examResult: {
                ...examResult,
                questions: examResult.exam.examQuestions.map(eq => ({
                    ...eq.question,
                    order: eq.order
                }))
            }
        });
    } catch (error) {
        console.error("Error iniciando examen:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//recuperar estado (estudiantes)
router.get("/:examId/session", authenticateToken, requireStudent, async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.id;

        // Buscar sesión activa
        const examResult = await prisma.examResult.findFirst({
            where: {
                examId: examId,
                userId: userId,
                status: "IN_PROGRESS"
            },
            include: {
                exam: {
                    include: {
                        examQuestions: {
                            include: {
                                question: true
                            },
                            orderBy: { order: "asc" }
                        }
                    }
                },
                answers: true
            }
        });

        if (!examResult) {
            return res.status(404).json({
                success: false,
                error: "No hay una sesión activa para este examen"
            });
        }

        // Calcular tiempo restante
        const timeLimit = examResult.exam.timeLimit * 60; // convertir a segundos
        const elapsed = Math.floor((Date.now() - new Date(examResult.startedAt).getTime()) / 1000);
        const timeRemaining = Math.max(0, timeLimit - elapsed);

        // Formatear respuesta
        const response = {
            id: examResult.id,
            startedAt: examResult.startedAt,
            timeRemaining: timeRemaining,
            exam: {
                id: examResult.exam.id,
                title: examResult.exam.title,
                description: examResult.exam.description,
                timeLimit: examResult.exam.timeLimit,
                questions: examResult.exam.examQuestions.map(eq => ({
                    id: eq.question.id,
                    header: eq.question.header,
                    alternatives: eq.question.alternatives,
                    educationalIndicator: eq.question.educationalIndicator,
                    professor: eq.question.professor,
                    order: eq.order
                }))
            },
            answers: examResult.answers.reduce((acc, answer) => {
                acc[answer.questionId] = answer.selectedAnswer;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            session: response
        });

    } catch (error) {
        console.error("Error obteniendo sesión de examen:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor"
        });
    }
});

//Responder pregunta
router.post("/results/:resultId/answer", authenticateToken, requireStudent, async (req, res) => {
    try {
        const {resultId} = req.params
        const {questionId, selectedAnswer, timeSpent} = req.body

        console.log("Respondiendo pregunta:", {resultId, questionId, selectedAnswer})

        //Verificar que el resultado existe y pertenece al usuario
        const examResult = await prisma.examResult.findFirst({
            where: {
                id: resultId,
                userId: req.user.id,
                status: "IN_PROGRESS",
            },
        })

        if(!examResult) {
            return res.status(404).json({error:"Resultado de examen no encontrado o ya completado"})
        }

        //Obtener la pregunta con la respuesta correcta
        const question = await prisma.question.findUnique({where: {id:questionId}})

        if(!question) {
            return res.status(404).json({error:"Pregunta no encontrada"})
        }

        //Verificar si ya respondió esta pregunta y si es correcta
        const existingAnswer = await prisma.examAnswer.findFirst({
            where: {
                examResultId: resultId,
                questionId: questionId
            }
        })

        if(existingAnswer) {
            return res.status(400).json({error:"Ya has respondido esta pregunta"})
        }

        const isCorrect = selectedAnswer === question.correctAnswer

        //Crear respuesta
        const answer = await prisma.examAnswer.create({
            data: {
                examResultId: resultId,
                questionId: questionId,
                selectedAnswer: selectedAnswer,
                isCorrect: isCorrect,
                timeSpent: timeSpent || null
            }
        })

        console.log("Respuesta guardada:", {answerId: answer.id, isCorrect})

        res.status(201).json({
            message: "Respuesta guardada exitosamente",
            answer: {
                id: answer.id,
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect: answer.isCorrect
            }
        })
    } catch (error) {
        console.error("Error guardando respuesta:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Finalizar examen
router.post("/results/:resultId/submit", authenticateToken, requireStudent, async (req, res) => {
    try {
        const {resultId} = req.params
        const userId = req.user.id

        console.log("Finalizando examen:", {resultId})

        //Verificar que el resultado existe y pertenece al usuario
        const examResult = await prisma.examResult.findFirst({
            where: {
                id: resultId,
                userId: req.user.id,
                status: "IN_PROGRESS"
            },
            include: {
                answers: {
                    include: {
                        question: true
                    }
                },
                exam: true
            }
        })

        if(!examResult) {
            return res.status(404).json({
                success: false,
                error:"Resultado de examen no encontrado o ya completado"
            })
        }

        //Calcular puntaje
        const correctAnswers = examResult.answers.filter(a => a.isCorrect).length;
        const totalQuestions = examResult.totalQuestions
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        //Actualizar resultado
        const updatedResult = await prisma.examResult.update({
            where: {id: resultId},
                data: {
                    totalScore: correctAnswers,
                    percentage: percentage,
                    status: "COMPLETED",
                    completedAt: new Date()
                },
            include: {
                exam: {
                    select: {
                        title: true,
                        description: true,
                        passingScore: true
                    }
                },
                answers: true
            }
        })

        console.log("Examen finalizado:", {
            resultId,
            score: `${correctAnswers}/${totalQuestions}`,
            percentage: `${percentage.toFixed(1)}%`
        })

        res.json({
            success: true,
            message: "Examen enviado exitosamente",
            examResult: updatedResult
        });
    } catch (error) {
        console.error("Error finalizando examen:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor"
        });
    }
})

router.get("/:examId/latest-result", authenticateToken, requireStudent, async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.id;

        const examResult = await prisma.examResult.findFirst({
            where: {
                examId: examId,
                userId: userId,
                status: "COMPLETED"
            },
            orderBy: {
                completedAt: "desc"
            },
            include: {
                exam: true,
                answers: true
            }
        });

        if (!examResult) {
            return res.status(404).json({
                success: false,
                error: "No se encontraron resultados para este examen"
            });
        }

        res.json({
            success: true,
            examResult: examResult
        });

    } catch (error) {
        console.error("Error obteniendo último resultado:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor"
        });
    }
});

//Obtener resultados del usuario actual
router.get("/my-results", authenticateToken, requireStudent, async (req, res) => {
    try {
        const results = await prisma.examResult.findMany({
            where: {userId: req.user.id},
            include: {
                exam: {
                    select: {
                        title: true,
                        description: true
                    }
                },
                reportData: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 1
        })

        res.json({results, total: results.length, lastResult: results[0] || null})
    } catch (error) {
        console.error("Error obteniendo resultados:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

// Obtener examen específico por ID (admin)
router.get("/:examId", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { examId } = req.params;

        // Primero obtener el examen básico
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                timeLimit: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        examResults: true,
                        examQuestions: true
                    }
                }
            }
        });

        if (!exam) {
            return res.status(404).json({ 
                error: "Examen no encontrado",
                details: `No se encontró examen con ID: ${examId}`
            });
        }

        // Luego obtener las preguntas asociadas desde ExamQuestion
        const examQuestions = await prisma.examQuestion.findMany({
            where: { examId },
            include: {
                question: {
                    select: {
                        id: true,
                        header: true,
                        educationalIndicator: true,
                        isActive: true,
                        professor: {
                            select: {
                                name: true,
                                subject: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                order: "asc"
            }
        });

        // Formatear la respuesta
        const response = {
            ...exam,
            questions: examQuestions.map(eq => ({
                ...eq.question,
                order: eq.order // Incluir el orden de la pregunta en el examen
            }))
        };

        res.json(response);
    } catch (error) {
        console.error(`Error obteniendo examen con ID ${examId}:`, error);
        res.status(500).json({ 
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

export default router