'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveHistoricalResultAction(formData: FormData) {
    const season = formData.get("season") as string
    const leagueName = formData.get("leagueName") as string
    const category = formData.get("category") as string

    const championId = formData.get("championId") as string || null
    const runnerUpId = formData.get("runnerUpId") as string || null
    const thirdPlaceId = formData.get("thirdPlaceId") as string || null

    if (!season || !leagueName) return { success: false, message: "Dados inválidos." }

    try {
        // Busca se já existe registro dessa liga nessa temporada
        const existing = await prisma.historicalResult.findFirst({
            where: { season, leagueName }
        })

        if (existing) {
            // Atualiza
            await prisma.historicalResult.update({
                where: { id: existing.id },
                data: { championId, runnerUpId, thirdPlaceId, category }
            })
        } else {
            // Cria novo
            await prisma.historicalResult.create({
                data: { season, leagueName, category, championId, runnerUpId, thirdPlaceId }
            })
        }

        revalidatePath("/historico")
        revalidatePath("/admin/historico") // Vamos criar essa rota
        return { success: true, message: "Resultado salvo com sucesso!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao salvar." }
    }
}