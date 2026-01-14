'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculatePoints } from "@/utils/scoring"
import { getMatchesByDate, getLiveMatches } from "@/services/football-api"

export async function updateRoundResultsAction(roundId: string, slug: string) {
    console.log("🚀 [DEBUG] Iniciando atualização da rodada:", roundId)

    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        // 1. EXTRAIR DATAS ÚNICAS
        const uniqueDates = Array.from(new Set(round.matches.map(m => {
            return m.date.toISOString().split('T')[0]
        })))

        console.log(`📅 [DEBUG] Datas para buscar:`, uniqueDates)

        let foundGames: any[] = []

        // 2. BUSCAR NA API (Por Data)
        for (const date of uniqueDates) {
            const games = await getMatchesByDate(date)
            if (games.length > 0) {
                foundGames = [...foundGames, ...games]
            }
        }

        // 3. BUSCAR AO VIVO (Garantia extra)
        const liveGames = await getLiveMatches()
        if (liveGames.length > 0) {
            foundGames = [...foundGames, ...liveGames]
        }

        console.log(`📡 [DEBUG] Total de jogos encontrados na API (Mundo todo): ${foundGames.length}`)

        let gamesUpdatedCount = 0

        // 4. ATUALIZAR NO BANCO (Cruzamento de IDs)
        for (const apiGame of foundGames) {

            // CORREÇÃO AQUI: Normalizamos para Número para o Banco de Dados
            const apiIdInt = Number(apiGame.apiId)

            // Na comparação, transformamos o do banco em string para garantir match
            // (Isso resolve o erro se um for Int e o outro String no Typescript)
            const matchInDb = round.matches.find(m => m.apiId?.toString() === apiIdInt.toString())

            if (matchInDb) {
                // Traduz status
                let ourStatus = 'SCHEDULED'
                if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(apiGame.status)) ourStatus = 'LIVE'
                if (['FT', 'AET', 'PEN'].includes(apiGame.status)) ourStatus = 'FINISHED'
                if (['PST', 'CANC', 'ABD'].includes(apiGame.status)) ourStatus = 'SCHEDULED'

                console.log(`💾 [SYNC SUCESSO] ${matchInDb.homeTeam} x ${matchInDb.awayTeam} -> ${apiGame.homeScore}x${apiGame.awayScore} (${ourStatus})`)

                await prisma.match.updateMany({
                    // Aqui usamos o Int, que é o que o seu banco espera
                    where: { apiId: apiIdInt },
                    data: {
                        homeScore: apiGame.homeScore,
                        awayScore: apiGame.awayScore,
                        status: ourStatus as any
                    }
                })
                gamesUpdatedCount++
            }
        }

        if (gamesUpdatedCount === 0) {
            console.warn("⚠️ [AVISO] A API trouxe jogos, mas nenhum ID bateu. Verifique se os 'apiId' no banco estão corretos.")
        }

        // 5. RECALCULAR PONTOS
        const updatedRound = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (updatedRound) {
            for (const match of updatedRound.matches) {
                if (match.homeScore !== null && match.awayScore !== null) {
                    for (const prediction of match.predictions) {
                        const result = calculatePoints(
                            match.homeScore, match.awayScore,
                            prediction.homeScore, prediction.awayScore
                        )
                        await prisma.prediction.update({
                            where: { id: prediction.id },
                            data: {
                                pointsEarned: result.points,
                                exactScore: result.type.includes('EXACT') || result.type === 'OUSADO' || result.type === 'EMPATE_EXATO',
                                isProcessed: true
                            }
                        })
                    }
                }
            }
        }

        // 6. ATUALIZAR RANKING
        const participants = await prisma.championshipParticipant.findMany({
            where: { championshipId: round.championshipId }
        })

        for (const participant of participants) {
            if (participant.userId) {
                const agg = await prisma.prediction.aggregate({
                    _sum: { pointsEarned: true },
                    where: {
                        userId: participant.userId,
                        match: { round: { championshipId: round.championshipId } }
                    }
                })
                await prisma.championshipParticipant.update({
                    where: { id: participant.id },
                    data: { points: agg._sum.pointsEarned || 0 }
                })
            }
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)

        return { success: true, message: `Sucesso! ${gamesUpdatedCount} placares sincronizados.` }

    } catch (error) {
        console.error("🔥 [ERRO CRÍTICO]:", error)
        return { success: false, message: "Erro interno ao atualizar." }
    }
}