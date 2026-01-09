'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // 1. Validar se preencheu tudo
    if (!email || !password) {
        return
    }

    // 2. Buscar usuário no banco
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log("Usuário não encontrado")
        return
    }

    // 3. Verificar a senha
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        console.log("Senha incorreta")
        return
    }

    // 4. Criar a Sessão
    const cookieStore = await cookies()

    cookieStore.set("palpita_session", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
    })

    // 5. Redirecionar
    redirect("/dashboard")
}