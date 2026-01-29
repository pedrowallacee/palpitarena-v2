'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateRoundSettingsAction(formData: FormData) {
    const roundId = formData.get("roundId") as string
    const status = formData.get("status") as string
    const deadlineString = formData.get("deadline") as string // Vem como "2026-01-29T17:00"
    const slug = formData.get("slug") as string

    try {
        const finalDate = new Date(`${deadlineString}:00.000-03:00`)

        await prisma.round.update({
            where: { id: roundId },
            data: {
                status: status as any,
                deadline: finalDate,
            }
        })

        // Força a atualização da página
        revalidatePath(`/campeonatos/${slug}`)

        return { success: true, message: "Rodada atualizada com sucesso!" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao atualizar." }
    }
}