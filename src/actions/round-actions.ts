'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createRoundAction(formData: FormData) {
    const name = formData.get("name") as string
    const deadline = formData.get("deadline") as string
    const championshipId = formData.get("championshipId") as string

    if (!name || !deadline || !championshipId) {
        return { success: false, message: "Preencha todos os campos." }
    }

    try {
        await prisma.round.create({
            data: {
                name,
                deadline: new Date(deadline),
                championshipId,
                status: "OPEN"
            }
        })

        revalidatePath(`/campeonatos`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao criar rodada." }
    }
}