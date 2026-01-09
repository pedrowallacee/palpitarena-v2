'use server'

import { prisma } from "@/lib/prisma" // Se der erro aqui, a gente cria o lib jájá
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

export async function registerUser(formData: FormData) {
    // 1. Pegar os dados do formulário HTML
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // 2. Validação básica
    if (!name || !email || !password) {
        throw new Error("Preencha todos os campos!")
    }

    // 3. Verificar se o email já existe
    const userExists = await prisma.user.findUnique({
        where: { email }
    })

    if (userExists) {
        // Em um app real, retornariamos um erro para a tela, mas vamos simplificar
        console.log("Usuário já existe")
        return { error: "Email já cadastrado" }
    }

    // 4. Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // 5. Criar no Banco de Dados
    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "USER"
        }
    })

    // 6. Redirecionar para o Login
    redirect("/login")
}