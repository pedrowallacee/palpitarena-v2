'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateRoundSettingsAction(formData: FormData) {
    const roundId = formData.get("roundId") as string
    const status = formData.get("status") as string // OPEN, SCHEDULED, CLOSED, FINISHED
    const deadlineString = formData.get("deadline") as string // Vem do input datetime-local
    const slug = formData.get("slug") as string

    try {
        await prisma.round.update({
            where: { id: roundId },
            data: {
                status: status as any,
                deadline: new Date(deadlineString), // Converte o texto do input para Data Real
            }
        })

        revalidatePath(`/campeonatos/${slug}`)
        return { success: true, message: "Rodada atualizada com sucesso!" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao atualizar." }
    }
}