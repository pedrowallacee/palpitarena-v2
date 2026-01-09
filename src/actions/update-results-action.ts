'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Regra de Pontuação Simples (Pode ser extraída para um arquivo utils depois)
function calculatePoints(predHome: number, predAway: number, realHome: number, realAway: number) {
    // 1. Cravada (Placar Exato) = 3 Pontos (ou 5, depende da sua regra)
    if (predHome === realHome && predAway === realAway) {
        return 3 // Mude para 5 se preferir
    }

    // 2. Acertou o Vencedor ou Empate (Mas errou placar) = 1 Ponto
    const predWinner = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW'
    const realWinner = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'DRAW'

    if (predWinner === realWinner) {
        return 1 // Mude para 3 se preferir
    }

    // 3. Errou tudo
    return 0
}

export async function updateMatchResult(formData: FormData) {
    const matchId = formData.get("matchId") as string
    const homeScore = Number(formData.get("homeScore"))
    const awayScore = Number(formData.get("awayScore"))
    const slug = formData.get("slug") as string
    const roundId = formData.get("roundId") as string

    if (!matchId) return { success: false, message: "ID do jogo inválido" }

    try {
        // 1. Atualiza o Jogo Real com o Placar Final
        const match = await prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                status: 'FINISHED'
            },
            include: {
                // Precisamos saber a rodada -> campeonato para achar os participantes
                round: true,
                // Precisamos de todos os palpites desse jogo
                predictions: true
            }
        })

        const championshipId = match.round.championshipId

        // 2. Calcula pontos para cada palpiteiro
        for (const prediction of match.predictions) {
            const points = calculatePoints(prediction.homeScore, prediction.awayScore, homeScore, awayScore)

            // Se o usuário pontuou (pontos > 0) ou se precisamos atualizar o zero
            if (points >= 0) {
                // A. Atualiza o Palpite (Prediction) para mostrar na tela "Ganhou X pontos"
                await prisma.prediction.update({
                    where: { id: prediction.id },
                    data: {
                        pointsEarned: points,
                        isProcessed: true,
                        exactScore: points >= 3 // Considera cravada se for maior que a pontuação base
                    }
                })

                // B. Atualiza o Ranking do Participante (CORREÇÃO DO ERRO)
                // Em vez de atualizar prisma.user, atualizamos prisma.championshipParticipant
                await prisma.championshipParticipant.update({
                    where: {
                        userId_championshipId: {
                            userId: prediction.userId,
                            championshipId: championshipId
                        }
                    },
                    data: {
                        // Soma os pontos no ranking de palpites
                        predictionPoints: { increment: points },
                        // Soma na pontuação geral (usada para classificação)
                        points: { increment: points }
                    }
                })
            }
        }

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, message: "Resultado salvo e ranking atualizado!" }

    } catch (error) {
        console.error("Erro ao atualizar resultado:", error)
        return { success: false, message: "Erro ao processar resultados." }
    }
}