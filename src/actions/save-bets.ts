// src/actions/save-bets.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function saveBetsAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return { success: false, message: "Usuário não logado" }

    // Vamos varrer os dados do formulário
    const entries = Array.from(formData.entries())

    // Filtra apenas os campos de score (ex: home_matchID e away_matchID)
    const updates = []

    // Agrupamos os dados por MatchID
    const matchesToUpdate = new Set<string>()
    entries.forEach(([key]) => {
        if (key.startsWith('home_') || key.startsWith('away_')) {
            const matchId = key.split('_')[1]
            matchesToUpdate.add(matchId)
        }
    })

    try {
        // Processa cada jogo identificado no form
        for (const matchId of matchesToUpdate) {
            const homeScore = formData.get(`home_${matchId}`)
            const awayScore = formData.get(`away_${matchId}`)

            if (homeScore !== null && awayScore !== null && homeScore !== "" && awayScore !== "") {
                // Upsert: Cria se não existe, atualiza se existe
                await prisma.bet.upsert({
                    where: {
                        userId_matchId: {
                            userId: userId,
                            matchId: matchId
                        }
                    },
                    update: {
                        homeTeamScore: Number(homeScore),
                        awayTeamScore: Number(awayScore)
                    },
                    create: {
                        userId: userId,
                        matchId: matchId,
                        homeTeamScore: Number(homeScore),
                        awayTeamScore: Number(awayScore)
                    }
                })
            }
        }

        revalidatePath("/campeonatos/[slug]/rodada")
        return { success: true, message: "Palpites salvos com sucesso!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao salvar palpites" }
    }
}