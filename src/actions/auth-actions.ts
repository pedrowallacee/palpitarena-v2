'use server'

import { prisma } from "@/lib/prisma"
import { compare, hash } from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// --- REGISTRO (CRIAR CONTA) ---
export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
        return { success: false, message: "Preencha todos os campos." }
    }

    try {
        const userExists = await prisma.user.findUnique({ where: { email } })
        if (userExists) return { success: false, message: "Email já cadastrado." }

        const hashedPassword = await hash(password, 10)

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: 'USER' }
        })

        // Cria a sessão automaticamente após cadastro
        const cookieStore = await cookies()
        cookieStore.set("palpita_session", user.id, { httpOnly: true, secure: true })

        return { success: true, message: "Bem-vindo ao time!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao criar conta." }
    }
}

// --- LOGIN (ENTRAR) ---
export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !(await compare(password, user.password))) {
            return { success: false, message: "Email ou senha incorretos." }
        }

        // Salva o ID do usuário no Cookie (Sessão Simples)
        const cookieStore = await cookies()
        cookieStore.set("palpita_session", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 7 dias
        })

        return { success: true, message: "Login realizado!" }

    } catch (error) {
        return { success: false, message: "Erro ao fazer login." }
    }
}

// --- LOGOUT (SAIR) ---
export async function logoutUser() {
    const cookieStore = await cookies()
    cookieStore.delete("palpita_session")
    redirect("/")
}