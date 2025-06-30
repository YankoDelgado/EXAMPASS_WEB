import { PrismaClient } from "@prisma/client";

//evitar multiples conexiones}
const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production"){
    globalForPrisma.prisma = prisma
}

//Para desconectar en caso de testing
export const disconnectPrisma = async () =>{
    await prisma.$disconnect()
}
