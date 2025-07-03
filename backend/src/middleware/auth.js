import jwt from "jsonwebtoken"
import {prisma} from "../lib/prisma.js"

export const authenticateToken = async(req, res, next) =>{
    try{
        const authHeader =req.headers["authorization"]
        const token = authHeader && authHeader.split(" ")[1]

        if (!token){
            return res.status(401).json({error:"Token de acceso requerido"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        //Buscar usuario en la base de datos
        const user=await prisma.user.findUnique({
            where:{id:decoded.userId},
            include:{studentProfile:true},
        })

        if (!user){
            return res.status(401).json({error:"Usuario no encontrado"})
        }
        req.user = user
        next()
    }catch(error){
        console.error("Error de autenticación:", error)
        return res.status(403).json({error:"Token inválido"})
    }
}

//Verificar rol de adminitrador
export const requireAdmin = async(req, res, next) =>{
    if(req.user.role !== "ADMIN"){
        return res.status(403).json({error:"Acceso denegado. Se requieren permisos de administrador"})
    }
    next()
}

//Verificar rol de estudiante
export const requireStudent = async(req, res, next) =>{
    if(req.user.role !== "STUDENT"){
        return res.status(403).json({error:"Acceso denegado. Solo para estudiantes"})
    }
    next()
}

//Generar JWT
export const generateToken = (userId, role) =>{
    return jwt.sign({userId, role}, process.env.JWT_SECRET, {expiresIn: "1h"})
}