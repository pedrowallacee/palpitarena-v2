'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function saveAllPredictionsAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return { success: false, message: "Sessão expirada." }

    const championshipId = formData.get("championshipId") as string
    const roundId = formData.get("roundId") as string

    const predictionsToSave = []

    // Converte form data em objeto
    const data = Object.fromEntries(formData.entries())

    for (const key in data) {
        if (key.startsWith("home_")) {
            const matchId = key.replace("home_", "")
            const homeScore = data[`home_${matchId}`]
            const awayScore = data[`away_${matchId}`]

            // Valida se os campos não estão vazios
            if (homeScore !== "" && awayScore !== "") {

                // === TRAVA DE SEGURANÇA ===
                // Verifica se o jogo já começou antes de salvar
                const match = await prisma.match.findUnique({
                    where: { id: matchId },
                    select: { date: true, status: true }
                })

                // Se o jogo existe E (já passou da hora OU já acabou/está ao vivo)
                if (match) {
                    const now = new Date()
                    if (now > match.date || match.status === 'LIVE' || match.status === 'FINISHED') {
                        // Pula este jogo, não deixa salvar
                        continue
                    }
                }

                predictionsToSave.push({
                    matchId,
                    homeScore: parseInt(homeScore.toString()),
                    awayScore: parseInt(awayScore.toString())
                })
            }
        }
    }

    if (predictionsToSave.length === 0) {
        // Pode ser que o usuário tentou salvar só jogos que já começaram
        return { success: false, message: "Nenhum palpite válido (jogos encerrados ou não preenchidos)." }
    }

    try {
        await prisma.$transaction(
            predictionsToSave.map(p =>
                prisma.prediction.upsert({
                    where: {
                        userId_matchId: { userId, matchId: p.matchId }
                    },
                    update: {
                        homeScore: p.homeScore,
                        awayScore: p.awayScore
                    },
                    create: {
                        userId,
                        matchId: p.matchId,
                        homeScore: p.homeScore,
                        awayScore: p.awayScore,
                        roundId
                    }
                })
            )
        )

        revalidatePath(`/campeonatos/${championshipId}/rodada/${roundId}`)
        return { success: true, message: "✅ Palpites salvos com sucesso!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao salvar palpites." }
    }
}