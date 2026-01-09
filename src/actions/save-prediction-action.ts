'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function savePrediction(matchId: string, homeScore: number, awayScore: number, slug: string, roundId: string) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return { error: "Usuário não logado" }

    try {
        // Upsert: Atualiza se existir, Cria se não existir (Mágica do Prisma)
        await prisma.prediction.upsert({
            where: {
                userId_matchId: {
                    userId,
                    matchId
                }
            },
            update: {
                homeScore,
                awayScore
            },
            create: {
                userId,
                matchId,
                homeScore,
                awayScore
            }
        })

        // Atualiza a tela para mostrar que salvou (opcional, pois vamos fazer feedback visual no botão)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true }

    } catch (error) {
        console.error("Erro ao salvar palpite:", error)
        return { error: "Erro ao salvar" }
    }
}