'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function createChampionship(formData: FormData) {
    try {
        // 1. Verificar quem é o usuário
        const cookieStore = await cookies()
        const userId = cookieStore.get("palpita_session")?.value

        if (!userId) {
            console.log("Erro: Usuário não logado tenta criar liga")
            redirect("/login")
        }

        // 2. Pegar os dados
        const name = formData.get("name") as string
        const description = formData.get("description") as string

        if (!name) return

        console.log("Tentando criar campeonato:", name)

        // 3. Gerar o Slug
        const slug = name
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "-")
                .replace(/[^\w-]+/g, "")
            + "-" + Math.floor(Math.random() * 1000)

        // 4. Salvar no Banco
        await prisma.championship.create({
            data: {
                name,
                slug,
                description,
                ownerId: userId // Importante: Liga o user ao campeonato
            }
        })

        console.log("Campeonato criado com sucesso! Redirecionando...")

    } catch (error) {
        // SE DER ERRO, VAI APARECER AQUI NO TERMINAL
        console.error("ERRO AO CRIAR CAMPEONATO:", error)
        return // Para a execução para não tentar redirecionar se falhou
    }

    // 5. Redirecionar para o Dashboard
    redirect("/dashboard")
}