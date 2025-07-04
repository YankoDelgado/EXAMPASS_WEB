import express from "express"
import {prisma} from "../lib/prisma.js"
import { authenticateToken, requireAdmin, requireStudent } from "../middleware/auth.js"

const router = express.Router()

//Generar reporte individual (automático después del examen)
router.post("/generate/:examResultId", authenticateToken, async (req, res) => {
    try {
        const {examResultId} = req.params

        console.log("Generando reporte para resultado:", examResultId)

        // Verificar que el resultado existe y está completado
        const examResult = await prisma.examResult.findFirst({
            where: {
                id: examResultId,
                status: "COMPLETED",
                OR: [{ userId: req.user.id }, { user: { role: "ADMIN" } }] // Solo el dueño del resultado o admin puede generar reporte
            },
            include: {
                answers: {
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
                    }
                },
                exam: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        if(!examResult) {
            return res.status(404).json({error:"Resultado de examen no encontrado o no completado"})
        }

        //Verificar si ya existe un reporte
        const existingReport = await prisma.examReport.findUnique({where: {examResultId: examResultId}})

        if(existingReport) {
            return res.status(400).json({error:"Ya existe un reporte para este resultado"})
        }

        //Analizar respuestas por contenido educativo
        const contentAnalysis = {}
        const subjectAnalysis = {}

        examResult.answers.forEach((answer) => {
            const indicator = answer.question.educationalIndicator
            const subject = answer.question.professor.subject

            //Análisis por indicador educativo
            if (!contentAnalysis[indicator]) {
                contentAnalysis[indicator] = {correct: 0, total: 0}
            }
            contentAnalysis[indicator].total++

            if(answer.isCorrect) {
                contentAnalysis[indicator].correct++
            }

            //Análisis por materia
            if(!subjectAnalysis[subject]) {
                subjectAnalysis[subject] = {correct: 0, total: 0}
            }
            subjectAnalysis[subject].total++

            if(answer.isCorrect) {
                subjectAnalysis[subject].correct++
            }
        })

        //Calcular porcentajes por contenido
        const contentBreakdown = {}
        Object.keys(contentAnalysis).forEach((indicator) => {
            const {correct, total} = contentAnalysis[indicator]
            contentBreakdown[indicator] = Math.round((correct / total) * 100)
        })

        //Calcular porcentajes por materia
        const subjectBreakdown = {}
        Object.keys(subjectAnalysis).forEach((subject) => {
            const {correct, total} = subjectAnalysis[subject]
            subjectBreakdown[subject] = Math.round((correct / total) * 100)
        })

        //Identificar fortalezas y debilidades
        const strengths = []
        const weaknesses = []

        Object.entries(contentBreakdown).forEach(([indicator, percentage]) => {
            if (percentage >= 80) {
                strengths.push(indicator)
            } else if (percentage < 60) {
                weaknesses.push(indicator)
            }
        })

        // Generar recomendaciones
        const recommendations = []

        if (examResult.percentage >= 90) {
        recommendations.push("¡Excelente desempeño! Continúa con tu nivel de estudio.")
        recommendations.push("Considera ayudar a otros estudiantes como tutor.")
        } else if (examResult.percentage >= 70) {
        recommendations.push("Buen desempeño general. Enfócate en las áreas identificadas como débiles.")
        recommendations.push("Practica ejercicios adicionales en los temas con menor puntaje.")
        } else if (examResult.percentage >= 50) {
        recommendations.push("Necesitas reforzar varios conceptos fundamentales.")
        recommendations.push("Considera buscar ayuda adicional o tutoría.")
        recommendations.push("Dedica más tiempo de estudio a las materias con menor puntaje.")
        } else {
        recommendations.push("Se recomienda revisar los conceptos básicos desde el inicio.")
        recommendations.push("Busca ayuda de un tutor o profesor especializado.")
        recommendations.push("Considera un plan de estudio estructurado y personalizado.")
        }

        //Recomendar profesor según área más débil
        let assignedProfessor = null
        let professorSubject = null

        if(weaknesses.length > 0) {
            //Encontrar la materia con menor puntaje
            const weakestSubject = Object.entries(subjectBreakdown).reduce((min, [subject, percentage]) =>
                percentage < min.percentage ? { subject, percentage } : min
            ).subject

            //Buscar profesor de esa materia
            const professor = await prisma.professor.findFirst({
                where: {
                    subject: {
                        contains: weakestSubject,
                        mode: "insensitive"
                    }
                }
            })

            if(professor) {
                assignedProfessor = professor.name
                professorSubject = professor.subject
                recommendations.push(`Se recomienda contactar al profesor ${professor.name} especialista en ${professor.subject}.`)
            }
        }

        // Crear reporte
        const report = await prisma.examReport.create({
            data: {
                examResultId: examResultId,
                contentBreakdown: {
                    ...contentBreakdown,
                    subjects: subjectBreakdown,
                },
                strengths: strengths,
                weaknesses: weaknesses,
                recommendations: recommendations,
                assignedProfessor: assignedProfessor,
                professorSubject: professorSubject
            }
        })

        console.log("Reporte generado:", {
            reportId: report.id,
            strengths: strengths.length,
            weaknesses: weaknesses.length,
            recommendations: recommendations.length
        })

        res.status(201).json({
            message: "Reporte generado exitosamente",
            report: {
                id: report.id,
                contentBreakdown: report.contentBreakdown,
                strengths: report.strengths,
                weaknesses: report.weaknesses,
                recommendations: report.recommendations,
                assignedProfessor: report.assignedProfessor,
                professorSubject: report.professorSubject,
                examResult: {
                    id: examResult.id,
                    totalScore: examResult.totalScore,
                    totalQuestions: examResult.totalQuestions,
                    percentage: examResult.percentage,
                    completedAt: examResult.completedAt
                }
            }
        })
    } catch (error) {
        console.error("Error generando reporte:", error)
        res.status(500).json({
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        })
    }
})

//Obtener reporte individual
router.get("/:examResultId", authenticateToken, async (req, res) => {
    try {
        const {examResultId} = req.params

        const report = await prisma.examReport.findUnique({
            where: {examResultId: examResultId},
            include: {
                examResult: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                        exam: {
                            select: {
                                title: true,
                                description: true
                            }
                        },
                        answers: {
                            include: {
                                question: {
                                    select: {
                                        header: true,
                                        alternatives: true,
                                        correctAnswer: true,
                                        educationalIndicator: true,
                                        professor: {
                                            select: {
                                                name: true,
                                                subject: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if(!report) {
            return res.status(404).json({error:"Reporte no encontrado"})
        }

        //Verificar permisos
        if(req.user.role !== "ADMIN" && report.examResult.user.email !== req.user.email) {
            return res.status(403).json({error:"No tienes permisos para ver este reporte"})
        }

        res.json({report: report})
    } catch (error) {
        console.error("Error obteniendo reporte:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Obtener mis reportes (estudiantes)
router.get("/my/reports", authenticateToken, requireStudent, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Obtener todos los reportes y resultados del estudiante
        const reports = await prisma.examReport.findMany({
            where: { examResult: { userId } },
            include: {
                examResult: {
                    select: {
                        percentage: true,
                        completedAt: true,
                        totalScore: true,
                        totalQuestions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Calcular estadísticas básicas
        const stats = {
            totalReports: reports.length,
            averageScore: 0,
            bestScore: 0,
            lastExamDate: null,
            improvementTrend: "stable",
            subjectPerformance: [],
            lastExam: null
        };

        if (reports.length > 0) {
            // Calcular puntajes promedio y mejor puntaje
            const percentages = reports.map(r => r.examResult.percentage);
            stats.averageScore = percentages.reduce((a, b) => a + b, 0) / percentages.length;
            stats.bestScore = Math.max(...percentages);
            stats.lastExamDate = reports[0].examResult.completedAt;

            // Calcular tendencia (comparando los últimos 2 exámenes)
            if (reports.length >= 2) {
                const [last, previous] = reports;
                stats.improvementTrend = last.examResult.percentage > previous.examResult.percentage 
                    ? "improving" 
                    : last.examResult.percentage < previous.examResult.percentage 
                        ? "declining" 
                        : "stable";
            }

            // Procesar contentBreakdown para obtener desempeño por materia
            const subjectMap = {};
            reports.forEach(report => {
                try {
                    const breakdown = typeof report.contentBreakdown === 'string' 
                        ? JSON.parse(report.contentBreakdown) 
                        : report.contentBreakdown;
                    
                    if (breakdown) {
                        Object.entries(breakdown).forEach(([subject, score]) => {
                            if (!subjectMap[subject]) {
                                subjectMap[subject] = { total: 0, sum: 0 };
                            }
                            subjectMap[subject].total++;
                            subjectMap[subject].sum += Number(score);
                        });
                    }
                } catch (e) {
                    console.error("Error procesando contentBreakdown:", e);
                }
            });

            stats.subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
                subject,
                averageScore: Math.round(data.sum / data.total),
                totalExams: data.total
            }));

            // Datos del último examen
            const lastReport = reports[0];
            stats.lastExam = {
                score: lastReport.examResult.percentage,
                correctAnswers: lastReport.examResult.totalScore,
                totalQuestions: lastReport.examResult.totalQuestions,
                strengths: lastReport.strengths,
                weaknesses: lastReport.weaknesses,
                recommendations: lastReport.recommendations,
                professor: lastReport.assignedProfessor ? {
                    name: lastReport.assignedProfessor,
                    subject: lastReport.professorSubject
                } : null
            };
        }

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Error calculando estadísticas:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
})

//Estadísticas generales (solo admins)
router.get("/admin/statistics", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Generando estadísticas administrativas...")

        //Estadísticas básicas
        const totalExams = await prisma.exam.count()
        const totalResults = await prisma.examResult.count({where: {status: "COMPLETED"}})
        const totalStudents = await prisma.user.count({where: {role: "STUDENT"}})
        const totalQuestions = await prisma.question.count({where: {isActive: true}})

        //Promedio general
        const avgResult = await prisma.examResult.aggregate({
            where: {status: "COMPLETED"},
            _avg: {percentage: true},
        })

        //Distribución de puntajes
        const scoreDistribution = await prisma.examResult.groupBy({
            by: ["percentage"],
            where: { status: "COMPLETED" },
            _count: true,
        })

        // Agrupar por rangos
        const ranges = {
            "90-100%": 0,
            "80-89%": 0,
            "70-79%": 0,
            "60-69%": 0,
            "50-59%": 0,
            "0-49%": 0,
        }

        scoreDistribution.forEach((item) => {
            const percentage = item.percentage
            if (percentage >= 90) ranges["90-100%"] += item._count
            else if (percentage >= 80) ranges["80-89%"] += item._count
            else if (percentage >= 70) ranges["70-79%"] += item._count
            else if (percentage >= 60) ranges["60-69%"] += item._count
            else if (percentage >= 50) ranges["50-59%"] += item._count
            else ranges["0-49%"] += item._count
        })

        //Preguntas más difíciles
        const questionStats = await prisma.examAnswer.groupBy({
            by: ["questionId"],
            _count: {
                _all: true
            }
        })

        const questionDifficulty = await Promise.all(
            questionStats.map(async (stat) => {
                const question = await prisma.question.findUnique({
                    where: {id: stat.questionId},
                    select: {
                        header: true,
                        educationalIndicator: true,
                        professor: {select: {subject: true}},
                    }
                })

                const correctAnswers = await prisma.examAnswer.count({
                    where: {
                        questionId: stat.questionId,
                        isCorrect: true
                    }
                })

                const correctRate = (correctAnswers / stat._count._all) * 100

                return {
                    questionId: stat.questionId,
                    header: question?.header,
                    subject: question?.professor?.subject,
                    indicator: question?.educationalIndicator,
                    totalAnswers: stat._count._all,
                    correctAnswers: correctAnswers,
                    correctRate: Math.round(correctRate)
                }
            }),
        )

        //Ordenar por dificultad (menor tasa de acierto = más difícil)
        questionDifficulty.sort((a, b) => a.correctRate - b.correctRate)

        //Materias con mejor/peor desempeño
        const subjectPerformance = {}
        const reports = await prisma.examReport.findMany({
            select: {contentBreakdown: true},
        })

        reports.forEach((report) => {
            const subjects = report.contentBreakdown.subjects || {}
            Object.entries(subjects).forEach(([subject, percentage]) => {
                if (!subjectPerformance[subject]) {
                    subjectPerformance[subject] = {total: 0, sum: 0}
                }
                subjectPerformance[subject].total++
                subjectPerformance[subject].sum += percentage
            })
        })

        const subjectAverages = Object.entries(subjectPerformance).map(([subject, data]) => ({
            subject,
            averagePercentage: Math.round(data.sum / data.total),
            totalEvaluations: data.total
        }))

        subjectAverages.sort((a, b) => b.averagePercentage - a.averagePercentage)

        res.json({
            overview: {
                totalExams,
                totalResults,
                totalStudents,
                totalQuestions,
                averagePercentage: Math.round(avgResult._avg.percentage || 0),
            },
            scoreDistribution: ranges,
            subjectPerformance: subjectAverages,
            difficultQuestions: questionDifficulty.slice(0, 10), // Top 10 más difíciles
            easiestQuestions: questionDifficulty.slice(-5), // Top 5 más fáciles
        })
    } catch (error) {
        console.error("Error generando estadísticas:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Reporte de estudiante específico (solo admins)
router.get("/admin/student/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {userId} = req.params

        const student = await prisma.user.findUnique({
            where: {id: userId, role: "STUDENT"},
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        })

        if(!student) {
            return res.status(404).json({error:"Estudiante no encontrado"})
        }

        const examResults = await prisma.examResult.findMany({
            where: {
                userId: userId,
                status: "COMPLETED"
            },
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
            }
        })

        //Calcular progreso
        const averageScore = examResults.length ? examResults.reduce((sum, result) => sum + result.percentage, 0) / examResults.length : 0

        //Identificar tendencias
        const recentResults = examResults.slice(0, 3)
        const trend = recentResults.length >= 2 ? recentResults[0].percentage > recentResults[1].percentage ? "improving" : "declining" : "stable"

        res.json({
            student,
            summary: {
                totalExams: examResults.length,
                averageScore: Math.round(averageScore),
                trend,
                lastExamDate: examResults[0]?.completedAt,
            },
            examResults,
        })
    } catch (error) {
        console.error("Error obteniendo reporte de estudiante:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

export default router