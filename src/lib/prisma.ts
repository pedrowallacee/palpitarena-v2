import { PrismaClient } from '@prisma/client'

// Adiciona o prisma ao escopo global do Node para evitar múltiplas instâncias
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma