import express from "express"
import {prisma} from "../lib/prisma.js"
import { authenticateToken, requireAdmin, requireStudent } from "../middleware/auth.js"

const router = express.Router()

//Generar reporte individual (automático después del examen)
router.post("/generate/:examResultId", authenticateToken, async (req, res) => {
    try {
        const { examResultId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";

        console.log(`Iniciando generación de reporte para resultado: ${examResultId}`);

        // 1. Validar y obtener el resultado del examen
        const examResult = await validateAndGetExamResult(examResultId, userId, isAdmin);
        if (!examResult) {
            return res.status(404).json({ error: "Resultado de examen no encontrado o no completado" });
        }

        // 2. Verificar si ya existe un reporte
        if (await checkExistingReport(examResultId)) {
            return res.status(400).json({ error: "Ya existe un reporte para este resultado" });
        }

        // 3. Analizar respuestas y generar datos del reporte
        const { contentBreakdown, subjectBreakdown } = analyzeAnswers(examResult.answers);
        const { strengths, weaknesses } = identifyStrengthsAndWeaknesses(contentBreakdown);
        const recommendations = generateRecommendations(examResult.percentage, weaknesses);
        
        // 4. Asignar profesor si hay áreas débiles
        const { assignedProfessor, professorSubject } = await assignProfessorForWeaknesses(
            weaknesses, 
            subjectBreakdown
        );

        // 5. Crear el reporte en la base de datos
        const report = await createExamReport({
            examResultId,
            contentBreakdown,
            subjectBreakdown,
            strengths,
            weaknesses,
            recommendations,
            assignedProfessor,
            professorSubject
        });

        console.log("Reporte generado exitosamente:", report.id);

        // 6. Retornar respuesta estructurada
        res.status(201).json(formatReportResponse(report, examResult));

    } catch (error) {
        console.error("Error generando reporte:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

// --- Funciones auxiliares ---

/**
 * Valida y obtiene el resultado del examen
 */
async function validateAndGetExamResult(examResultId, userId, isAdmin) {
    const whereClause = {
        id: examResultId,
        status: "COMPLETED",
        ...(!isAdmin && { userId }) // Solo admin puede ver todos los resultados
    };

    return await prisma.examResult.findFirst({
        where: whereClause,
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
    });
}

/**
 * Verifica si ya existe un reporte para este resultado
 */
async function checkExistingReport(examResultId) {
    return await prisma.examReport.findUnique({
        where: { examResultId }
    });
}

/**
 * Analiza las respuestas para generar estadísticas
 */
function analyzeAnswers(answers) {
    const contentAnalysis = {};
    const subjectAnalysis = {};

    answers.forEach((answer) => {
        const indicator = answer.question.educationalIndicator || 'Sin indicador';
        const subject = answer.question.professor?.subject || 'Sin materia';

        // Análisis por indicador educativo
        if (!contentAnalysis[indicator]) {
            contentAnalysis[indicator] = { correct: 0, total: 0 };
        }
        contentAnalysis[indicator].total++;
        if (answer.isCorrect) contentAnalysis[indicator].correct++;

        // Análisis por materia
        if (!subjectAnalysis[subject]) {
            subjectAnalysis[subject] = { correct: 0, total: 0 };
        }
        subjectAnalysis[subject].total++;
        if (answer.isCorrect) subjectAnalysis[subject].correct++;
    });

    // Calcular porcentajes
    const calculatePercentages = (analysis) => {
        return Object.entries(analysis).reduce((acc, [key, { correct, total }]) => {
            acc[key] = Math.round((correct / total) * 100);
            return acc;
        }, {});
    };

    return {
        contentBreakdown: calculatePercentages(contentAnalysis),
        subjectBreakdown: calculatePercentages(subjectAnalysis)
    };
}

/**
 * Identifica fortalezas y debilidades basado en los porcentajes
 */
function identifyStrengthsAndWeaknesses(contentBreakdown) {
    const strengths = [];
    const weaknesses = [];

    Object.entries(contentBreakdown).forEach(([indicator, percentage]) => {
        if (percentage >= 80) {
            strengths.push(indicator);
        } else if (percentage < 60) {
            weaknesses.push(indicator);
        }
    });

    return { strengths, weaknesses };
}

/**
 * Genera recomendaciones personalizadas
 */
function generateRecommendations(overallPercentage, weaknesses) {
    const recommendations = [];

    if (overallPercentage >= 90) {
        recommendations.push("¡Excelente desempeño! Continúa con tu nivel de estudio.");
        recommendations.push("Considera ayudar a otros estudiantes como tutor.");
    } else if (overallPercentage >= 70) {
        recommendations.push("Buen desempeño general. Enfócate en las áreas identificadas como débiles.");
        recommendations.push("Practica ejercicios adicionales en los temas con menor puntaje.");
    } else if (overallPercentage >= 50) {
        recommendations.push("Necesitas reforzar varios conceptos fundamentales.");
        recommendations.push("Considera buscar ayuda adicional o tutoría.");
    } else {
        recommendations.push("Se recomienda revisar los conceptos básicos desde el inicio.");
        recommendations.push("Busca ayuda de un tutor o profesor especializado.");
    }

    // Recomendaciones específicas para áreas débiles
    if (weaknesses.length > 0) {
        recommendations.push(`Áreas que requieren atención especial: ${weaknesses.join(', ')}.`);
    }

    return recommendations;
}

/**
 * Asigna profesor para áreas débiles
 */
async function assignProfessorForWeaknesses(weaknesses, subjectBreakdown) {
    let assignedProfessor = null;
    let professorSubject = null;

    if (weaknesses.length > 0) {
        try {
            const weakestSubject = Object.entries(subjectBreakdown).reduce((min, [subject, percentage]) => 
                percentage < min.percentage ? { subject, percentage } : min,
                { subject: null, percentage: 101 }
            ).subject;

            if (weakestSubject) {
                const professor = await prisma.professor.findFirst({
                    where: {
                        subject: {
                            contains: weakestSubject,
                            mode: "insensitive"
                        }
                    }
                });

                if (professor) {
                    assignedProfessor = professor.name;
                    professorSubject = professor.subject;
                }
            }
        } catch (error) {
            console.error("Error asignando profesor:", error);
            // No fallar el proceso si hay error al asignar profesor
        }
    }

    return { assignedProfessor, professorSubject };
}

/**
 * Crea el reporte en la base de datos
 */
async function createExamReport(reportData) {
    return await prisma.examReport.create({
        data: {
            examResultId: reportData.examResultId,
            contentBreakdown: {
                indicators: reportData.contentBreakdown,
                subjects: reportData.subjectBreakdown,
            },
            strengths: reportData.strengths,
            weaknesses: reportData.weaknesses,
            recommendations: reportData.recommendations,
            assignedProfessor: reportData.assignedProfessor,
            professorSubject: reportData.professorSubject
        }
    });
}

/**
 * Formatea la respuesta para el cliente
 */
function formatReportResponse(report, examResult) {
    return {
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
    };
}

router.get('/check/:examResultId', authenticateToken, async (req, res) => {
    try {
        const { examResultId } = req.params;
        const userId = req.user.id; // Asumiendo que usas autenticación

        // 1. Verificar si el resultado de examen existe y pertenece al usuario
        const examResult = await prisma.examResult.findUnique({
            where: { id: examResultId },
            select: { userId: true }
        });

        if (!examResult) {
            return res.status(404).json({ 
                error: "Resultado de examen no encontrado",
                exists: false
            });
        }

        // 2. Verificar permisos (solo el dueño o admin puede ver)
        if (examResult.userId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ 
                error: "No autorizado para ver este reporte",
                exists: false
            });
        }

        // 3. Buscar reporte existente
        const existingReport = await prisma.examReport.findFirst({
            where: { examResultId },
            select: { id: true }
        });

        res.json({ 
            exists: !!existingReport,
            reportId: existingReport?.id || null,
            examResultId
        });

    } catch (error) {
        console.error("Error checking report existence:", error);
        res.status(500).json({ 
            error: "Error al verificar el reporte",
            exists: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

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
        const { search, dateFrom, dateTo, minScore, maxScore, page = 1, limit = 10 } = req.query;

        // Validación de parámetros
        const parsedPage = Math.max(1, parseInt(page));
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit)));

        // Construir condiciones WHERE
        const where = {
            examResult: { 
                userId,
                ...(search && {
                    exam: {
                        title: { contains: search, mode: 'insensitive' }
                    }
                }),
                ...((minScore || maxScore) && {
                    percentage: {
                        ...(minScore && { gte: parseFloat(minScore) }),
                        ...(maxScore && { lte: parseFloat(maxScore) })
                    }
                }),
                ...((dateFrom || dateTo) && {
                    completedAt: {
                        ...(dateFrom && { gte: new Date(dateFrom) }),
                        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999Z`) })
                    }
                })
            }
        };

        // Obtener reportes con paginación (VERSIÓN CORREGIDA)
        const [reports, total] = await prisma.$transaction([
            prisma.examReport.findMany({
                where,
                include: {
                    examResult: {
                        include: {
                            exam: {
                                select: {
                                    title: true,
                                    description: true
                                }
                            }
                        }
                    }
                },
                orderBy: { 
                    createdAt: 'desc' 
                },
                skip: (parsedPage - 1) * parsedLimit,
                take: parsedLimit
            }),
            prisma.examReport.count({ where })
        ]);

        // Calcular estadísticas
        const stats = await calculateEnhancedStats(userId);

        res.json({
            success: true,
            reports: reports.map(report => ({
                ...report,
                examResult: {
                    ...report.examResult,
                    exam: report.examResult.exam || { title: "Examen no disponible" }
                }
            })),
            pagination: {
                total,
                pages: Math.ceil(total / parsedLimit),
                currentPage: parsedPage,
                limit: parsedLimit
            },
            stats
        });

    } catch (error) {
        console.error("Error en /my/reports:", {
            message: error.message,
            stack: error.stack,
            query: req.query,
            user: req.user
        });
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

// Función para calcular estadísticas
async function calculateEnhancedStats(userId) {
    const results = await prisma.examResult.findMany({
        where: { userId },
        select: {
            percentage: true,
            completedAt: true,
            exam: {
                select: {
                    id: true,
                    title: true
                }
            }
        },
        orderBy: {
            completedAt: 'desc'
        }
    });

    if (results.length === 0) {
        return {
            totalReports: 0,
            averageScore: 0,
            bestScore: 0,
            lastExamDate: null,
            improvementTrend: "stable",
            subjectPerformance: []
        };
    }

    const percentages = results.map(r => r.percentage);
    const averageScore = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const bestScore = Math.max(...percentages);
    const lastExamDate = results[0].completedAt;

    // Calcular tendencia (últimos 2 exámenes)
    let improvementTrend = "stable";
    if (results.length >= 2) {
        const [last, previous] = results;
        improvementTrend = last.percentage > previous.percentage ? "improving" : last.percentage < previous.percentage ? "declining" : "stable";
    }

    return {
        totalReports: results.length,
        averageScore,
        bestScore,
        lastExamDate,
        improvementTrend,
        lastExam: {
            title: results[0].exam.title,
            score: results[0].percentage
        }
    };
}

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