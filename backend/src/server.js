import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import {prisma} from "./lib/prisma.js"

import authRoutes from "./routes/auth.js"
import professorRoutes from "./routes/professors.js"
import questionRoutes from "./routes/questions.js"
import examRoutes from "./routes/exams.js"
import reportRoutes from "./routes/reports.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT 

//Middleware
app.use(
    cors({
        origin: [process.env.VITE_API_URL, "http://localhost:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE","OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Cache-Control"
        ],
        optionsSuccessStatus: 204,
        maxAge: 86400,
    }),
)
app.use(cors());
app.options('*', cors());

app.use(express.json())

//Middleware de logging
app.use((req, res, next)=>{
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`)
    next()
})

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || corsOptions.origin[0]);
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

// Rutas principales
app.get("/", (req, res)=>{
    res.json({
        message: "ExamPass API funcionando correctamente",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    })
})

app.get("/health", async (req, res)=>{
    try {
        await prisma.$queryRaw`SELECT 1`
        res.json({
        status: "OK",
        database: "Connected",
        timestamp: new Date().toISOString(),
        })
    } catch (error) {
        res.status(500).json({
        status: "ERROR",
        database: "Disconnected",
        error: error.message,
        timestamp: new Date().toISOString(),
        })
    }
})

// Rutas de la API
app.use("/api/auth", authRoutes)
app.use("/api/professors", professorRoutes)
app.use("/api/questions", questionRoutes)
app.use("/api/exams", examRoutes)
app.use("/api/reports", reportRoutes)

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error("Error:", err)
    res.status(500).json({
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === "development" ? err.message : "Algo salió mal",
    })
})

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        error: "Ruta no encontrada",
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
    })
})

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ExamPass ejecutándose en http://localhost:${PORT}`)
    console.log(`Prisma Studio: npx prisma studio`)
    console.log(`Frontend: ${process.env.VITE_API_URL || "http://localhost:5173"}`)
    console.log(`Entorno: ${process.env.NODE_ENV}`)
})

// Manejo de cierre graceful
process.on("SIGINT", async () => {
    console.log("\n Cerrando servidor...")
    await prisma.$disconnect()
    console.log("Desconectado de la base de datos")
    process.exit(0)
})

process.on("SIGTERM", async () => {
    console.log("\n Cerrando servidor (SIGTERM)...")
    await prisma.$disconnect()
    console.log("Desconectado de la base de datos")
    process.exit(0)
})