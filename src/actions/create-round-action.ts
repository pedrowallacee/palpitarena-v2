'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createRoundAction(formData: FormData) {
    const slug = formData.get("slug") as string
    const name = formData.get("name") as string
    const deadlineDate = formData.get("date") as string // "YYYY-MM-DD"
    const deadlineTime = formData.get("time") as string // "HH:MM"

    if (!slug || !name || !deadlineDate || !deadlineTime) {
        return { success: false, message: "Preencha todos os campos." }
    }

    try {
        // 1. Busca o campeonato pelo slug
        const championship = await prisma.championship.findUnique({
            where: { slug }
        })

        if (!championship) return { success: false, message: "Campeonato não encontrado." }

        // 2. Monta a Data ISO (Data + Hora)
        const deadlineISO = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString()

        // 3. Cria a Rodada
        const round = await prisma.round.create({
            data: {
                name,
                deadline: deadlineISO,
                championshipId: championship.id,
                status: 'OPEN'
            }
        })

        revalidatePath(`/campeonatos/${slug}`)

        // SUCESSO: Redireciona para dentro da rodada para adicionar jogos
        return { success: true, roundId: round.id }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao criar rodada." }
    }
}