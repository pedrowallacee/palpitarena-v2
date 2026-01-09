'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function saveBetsAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return { success: false, message: "Usuário não logado" }

    // Converte formData em array para iterar
    const entries = Array.from(formData.entries())

    // Identifica quais jogos receberam palpites
    const matchesToUpdate = new Set<string>()
    entries.forEach(([key]) => {
        if (key.startsWith('home_') || key.startsWith('away_')) {
            const matchId = key.split('_')[1]
            matchesToUpdate.add(matchId)
        }
    })

    try {
        for (const matchId of matchesToUpdate) {
            const homeScore = formData.get(`home_${matchId}`)
            const awayScore = formData.get(`away_${matchId}`)

            // Só salva se ambos os campos tiverem valor
            if (homeScore !== null && awayScore !== null && homeScore !== "" && awayScore !== "") {

                // ATUALIZADO: Usa 'prediction' em vez de 'bet'
                await prisma.prediction.upsert({
                    where: {
                        userId_matchId: {
                            userId: userId,
                            matchId: matchId
                        }
                    },
                    update: {
                        homeScore: Number(homeScore), // Nome novo da coluna
                        awayScore: Number(awayScore)  // Nome novo da coluna
                    },
                    create: {
                        userId: userId,
                        matchId: matchId,
                        homeScore: Number(homeScore),
                        awayScore: Number(awayScore)
                    }
                })
            }
        }

        revalidatePath("/campeonatos/[slug]/rodada")
        return { success: true, message: "Palpites salvos com sucesso!" }

    } catch (error) {
        console.error("Erro ao salvar palpites:", error)
        return { success: false, message: "Erro ao salvar palpites. Tente novamente." }
    }
}