import {prisma} from "../lib/prisma.js"
import express from "express"
import { authenticateToken, requireAdmin } from "../middleware/auth.js"

const router= express.Router()

// Obtener todos los profesores
router.get("/", authenticateToken, async (req, res) => {
    try {
        const professors = await prisma.professor.findMany({
        include: {
            questions: {
            select: {
                id: true,
                header: true,
                educationalIndicator: true,
                isActive: true,
            },
            },
            _count: {
            select: {
                questions: true,
            },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        })

        res.json({
            professors,
            total: professors.length,
        })
    } catch (error) {
        console.error("Error obteniendo profesores:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

// Obtener un profesor por ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const {id} = req.params

        const professor = await prisma.professor.findUnique({
            where: {id},
            include: {
                questions: {
                    orderBy: {
                        createdAt: "desc"
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        })

        if(!professor){
            return res.status(404).json({error:"Profesor no encontrado"})
        }

        res.json({professor})
    } catch (error) {
        console.error("Error obteniendo profesor:", error)
        res.status(500).json({error: "Error interno del servidor"})
    }
})

//Crear nuevo profesor (solo Admin)
router.post("/", authenticateToken, requireAdmin, async(req, res)=>{
    try{
        const {name,subject, bio, email, phone } =req.body

        console.log("Creando profesor", {name,subject})

        //validaciones
        if(!name || !subject){
            return res.status(400).json({error:"Nombre y asignatura son requeridos"})
        }
        if(name.trim().length<2){
            return res.status(400).json({error:"El nombre debe tener al menos 2 caracteres"})
        }
        if(subject.trim().length<2){
            return res.status(400).json({error:"La asignatura debe tener al menos 2 caracteres"})
        }

        // Verificar si ya existe un profesor con el mismo nombre y asignatura
        const existingProfessor=await prisma.professor.findFirst({
            where:{
                name: name.trim(),
                subject: subject.trim(),
            },
        })
        if(existingProfessor){
            return res.status(400).json({error:"Ya existe un profesor con ese nombre y asignatura"})
        }

        //Crear profesor
        const professor = await prisma.professor.create({
            data:{
                name: name.trim(),
                subject: subject.trim(),
                bio: bio?.trim(),
                email: email?.trim(),
                phone: phone?.trim(),
                status: "ACTIVE"
            },
        })
        console.log("Profesor creado:", { id: professor.id, name: professor.name, subject: professor.subject })

        res.status(201).json({message:"Profesor creado exitosamente", professor,})
    }catch(error){
        console.error("Error creando profesor:", error)
        res.status(500).json({error:"Error interno del servidor",details: process.env.NODE_ENV === "development" ? error.message : undefined,})
    }
})

//Actualizar profesor (solo Admin)
router.put("/:id", authenticateToken, requireAdmin, async(req, res)=>{
    try{
        const {id} = req.params
        const {name,subject, bio, email, phone } = req.body

        console.log("Actualizando profesor:", {id, name, subject})

        if(!name || !subject){
            return res.status(400).json({error:"Nombre y asignatura son requeridos"})
        }

        //Validar que el profesor existe
        const existingProfessor = await prisma.professor.findUnique({where:{id}})

        if(!existingProfessor){
            return res.status(404).json({error:"Profesor no encontrado"})
        }

        //Verificar si ya existe otro profesor con el mismo nombre y asignatura
        const duplicateProfessor = await prisma.professor.findFirst({where:{name: name.trim(),subject: subject.trim(),NOT: {id}/*excluyendo al profesor actual*/}})

        if(duplicateProfessor){
            return res.status(400).json({error:"Ya existe otro profesor con ese nombre y asignatura"})
        }

        //Actualizar Profesor 
        const updatedProfessor = await prisma.professor.update({
            where: {id},
            data:{
                name: name.trim(),
                subject: subject.trim(),
                bio: bio?.trim(),
                email: email?.trim(),
                phone: phone?.trim(),
                status: existingProfessor.status
            },
            include:{
                _count:{
                    select:{
                        questions:true
                    }
                }
            }
        })

        console.log("Profesor actualizado:",{id: updatedProfessor.id, name: updatedProfessor.name})

        res.json({
            message: "Profesor actualizado exitosamente",
            professor: updatedProfessor
        })
    }catch(error){
        console.error("Error actualizando profesor:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

//Eliminar profesor (solo Admin)
router.delete("/:id", authenticateToken, requireAdmin, async(req, res)=>{
    try{
        const {id} = req.params

        console.log("Eliminando profesor:",{id})

        //Verificar que el profesor existe
        const existingProfessor = await prisma.professor.findUnique({
            where : {id},
            include: {
                _count: {
                    select: {
                        questions:true
                    }
                }
            }
        })

        if(!existingProfessor){
            return res.status(404).json({error:"Profesor no encontrado"})
        }

        //Verificar si tiene preguntas asociadas
        if(existingProfessor._count.questions>0) {
            return res.status(400).json({
                error: `No se puede eliminar el profesor porque tiene ${existingProfessor._count.questions} pregunta(s) asociada(s)`,
                questionsCount: existingProfessor._count.questions
            })
        }

        // Eliminar profesor
        await prisma.professor.delete({where: {id}})

        console.log("Profesor eliminado:", {id, name: existingProfessor.name})

        res.json({
            message: "Profesor eliminado exitosamente",
            deletedProfessor: {
                id: existingProfessor.id,
                name: existingProfessor.name,
                subject: existingProfessor.subject
            }
        })
    }catch(error){
        console.error("Error eliminando profesor:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})
// Obtener profesores por asignatura
router.get("/subject/:subject", authenticateToken, async (req, res) => {
    try {
        const {subject} = req.params

        const professors = await prisma.professor.findMany({
            where: {
                subject: {
                contains: subject,
                mode:"insensitive" //Búsqueda en mayúscualas y minúsculas
                }
            },
            include: {
                _count: {
                select: {
                    questions:true
                }
                }
            },
            orderBy: {
                name:"asc"
            }
        })

        res.json({professors, total: professors.length, subject: subject})
    } catch (error) {
        console.error("Error obteniendo profesores por asignatura:", error)
        res.status(500).json({error:"Error interno del servidor" })
    }
})

export default router