'use server'

import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { redirect } from "next/navigation"

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
        return { success: false, message: "Preencha todos os campos." }
    }

    try {
        const userExists = await prisma.user.findUnique({
            where: { email }
        })

        if (userExists) {
            return { success: false, message: "Email já cadastrado." }
        }

        const hashedPassword = await hash(password, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        })

        return { success: true, message: "Conta criada com sucesso!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao criar conta." }
    }
}