import express from "express"
import bcrypt from "bcrypt"
import {prisma} from "../lib/prisma.js"
import { generateToken, authenticateToken } from "../middleware/auth.js"

const router = express.Router()

//Registro de usuario
router.post("/register", async (req, res) =>{
    try {
        const {email, password, name, role = "STUDENT"} = req.body

        // Validaciones básicas
        if (!email || !password || !name) {
        return res.status(400).json({error:"Email, contraseña y nombre son requeridos"})
        }

        if (password.length < 8) {
        return res.status(400).json({error:"La contraseña debe tener al menos 8 caracteres"})
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
        where: {email},
        })

        if (existingUser) {
        return res.status(400).json({error:"El usuario ya existe"})
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear usuario
        const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role,
        },
        })

        // Generar token
        const token = generateToken(user.id, user.role)

        res.status(201).json({
        message: "Usuario registrado exitosamente",
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        })
    } catch (error) {
        console.error("Error en registro:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

// Login de usuario
router.post("/login", async (req, res) =>{
    try {
        const {email, password} = req.body

        if (!email || !password) {
            return res.status(400).json({error:"Email y contraseña son requeridos"})
        }

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: {email},
            include: {studentProfile: true},
        })

        if (!user) {
            return res.status(401).json({error:"Credenciales inválidas"})
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ error:"Credenciales inválidas"})
        }

        // Generar token
        const token = generateToken(user.id, user.role)

        res.json({
        message: "Login exitoso",
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentProfile: user.studentProfile,
        },
        })
    } catch (error) {
        console.error("Error en login:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

// Obtener perfil del usuario actual
router.get("/profile", authenticateToken, async (req, res) =>{
    try {
        const user = await prisma.user.findUnique({
        where: {id: req.user.id},
        include: {
            studentProfile: true,
            examResults: {
            include: {reportData: true},
            orderBy: {createdAt: "desc"},
            },
        },
        })

        res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentProfile: user.studentProfile,
            examResults: user.examResults,
        },
        })
    } catch (error) {
        console.error("Error obteniendo perfil:", error)
        res.status(500).json({error:"Error interno del servidor"})
    }
})

// Verificar token
router.get("/verify", authenticateToken, (req, res) =>{
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
        },
    })
})

export default router

