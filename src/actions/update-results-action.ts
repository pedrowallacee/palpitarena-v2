'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getMatchesByDate } from "@/services/football-api"

// Função auxiliar de cálculo
function calculatePoints(predHome: number, predAway: number, realHome: number, realAway: number) {
    if (predHome === realHome && predAway === realAway) return 3 // Cravada

    const predWinner = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW'
    const realWinner = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'DRAW'

    if (predWinner === realWinner) return 1 // Acertou vencedor

    return 0 // Errou tudo
}

// 1. ATUALIZAR UM ÚNICO JOGO (Manual)
export async function updateMatchResult(formData: FormData) {
    const matchId = formData.get("matchId") as string
    const homeScore = Number(formData.get("homeScore"))
    const awayScore = Number(formData.get("awayScore"))
    const slug = formData.get("slug") as string
    const roundId = formData.get("roundId") as string

    if (!matchId) return { success: false, message: "ID inválido" }

    await processMatchUpdate(matchId, homeScore, awayScore)

    revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
    return { success: true, message: "Jogo atualizado!" }
}

// 2. ATUALIZAR RODADA INTEIRA (Via API)
export async function updateRoundResults(roundId: string, slug: string) {
    try {
        // Busca a data da rodada
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: true }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        // Busca dados atualizados na API
        // Pega a data do primeiro jogo ou da deadline para referência
        const dateRef = round.matches[0]?.date || round.deadline
        const dateStr = dateRef.toISOString().split('T')[0]

        const apiMatches = await getMatchesByDate(dateStr)

        if (!apiMatches || apiMatches.length === 0) {
            return { success: false, message: "Nenhum jogo encontrado na API para esta data." }
        }

        let updatedCount = 0

        // Para cada jogo no nosso banco, tenta achar o correspondente na API
        for (const dbMatch of round.matches) {
            const apiMatch = apiMatches.find(m => m.apiId === dbMatch.apiId)
            if (apiMatch && (apiMatch.status === 'FINISHED' || apiMatch.status === 'FT' || apiMatch.status === 'AET' || apiMatch.status === 'PEN')) {
                // Se o placar mudou, processa
                if (dbMatch.homeScore !== apiMatch.homeScore || dbMatch.awayScore !== apiMatch.awayScore) {
                    const hScore = (apiMatch as any).goals?.home ?? (apiMatch as any).homeScore
                    const aScore = (apiMatch as any).goals?.away ?? (apiMatch as any).awayScore

                    if (hScore !== undefined && aScore !== undefined) {
                        await processMatchUpdate(dbMatch.id, hScore, aScore)
                        updatedCount++
                    }
                }
            }
        }

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, message: `${updatedCount} jogos sincronizados!` }

    } catch (error) {
        console.error("Erro ao sincronizar rodada:", error)
        return { success: false, message: "Erro interno." }
    }
}

// Lógica Centralizada de Atualização e Pontuação
async function processMatchUpdate(matchId: string, homeScore: number, awayScore: number) {
    // 1. Atualiza Jogo
    const match = await prisma.match.update({
        where: { id: matchId },
        data: {
            homeScore,
            awayScore,
            status: 'FINISHED'
        },
        include: {
            round: true,
            predictions: true
        }
    })

    const championshipId = match.round.championshipId

    // 2. Calcula Pontos
    for (const prediction of match.predictions) {
        const points = calculatePoints(prediction.homeScore, prediction.awayScore, homeScore, awayScore)

        if (points >= 0) {
            // Atualiza Palpite
            await prisma.prediction.update({
                where: { id: prediction.id },
                data: {
                    pointsEarned: points,
                    isProcessed: true,
                    exactScore: points >= 3
                }
            })

            // Atualiza Ranking
            await prisma.championshipParticipant.update({
                where: {
                    userId_championshipId: {
                        userId: prediction.userId,
                        championshipId: championshipId
                    }
                },
                data: {
                    predictionPoints: { increment: points },
                    points: { increment: points }
                }
            })
        }
    }
}