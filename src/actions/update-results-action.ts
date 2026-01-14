'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculatePoints } from "@/utils/scoring"
import { getMatchesByDate, getLiveMatches } from "@/services/football-api"

export async function updateRoundResultsAction(roundId: string, slug: string) {
    console.log("🚀 [DEBUG] Iniciando atualização da rodada (CACHE ZERO):", roundId)

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

        // 2. BUSCAR NA API (Por Data) COM CACHE ZERO
        for (const date of uniqueDates) {
            // AQUI ESTÁ A MÁGICA: Passamos 0 no segundo parâmetro!
            console.log(`🔎 [API] Buscando dados FRESCOS (Sem cache) para: ${date}`)
            const games = await getMatchesByDate(date, 0)

            if (games.length > 0) {
                foundGames = [...foundGames, ...games]
            }
        }

        // 3. BUSCAR AO VIVO (Também ajuda se o cache da data falhar)
        const liveGames = await getLiveMatches()
        if (liveGames.length > 0) {
            foundGames = [...foundGames, ...liveGames]
        }

        console.log(`📡 [DEBUG] Total de jogos encontrados: ${foundGames.length}`)

        let gamesUpdatedCount = 0

        // 4. ATUALIZAR NO BANCO
        for (const apiGame of foundGames) {
            const apiIdInt = Number(apiGame.apiId)
            const matchInDb = round.matches.find(m => m.apiId?.toString() === apiIdInt.toString())

            if (matchInDb) {
                let ourStatus = 'SCHEDULED'

                // Mapeamento de Status
                // LIVE: 1H, 2H, HT (Intervalo), ET (Prorrogação), P (Penaltis rolando), BT (Break Time), INT (Interrompido)
                if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(apiGame.status)) ourStatus = 'LIVE'

                // FINISHED: FT (Full Time), AET (After Extra Time), PEN (Pênaltis Finalizado)
                if (['FT', 'AET', 'PEN'].includes(apiGame.status)) ourStatus = 'FINISHED'

                // SCHEDULED: TBD, NS, PST (Adiado), CANC (Cancelado), ABD (Abandonado)
                if (['TBD', 'NS', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(apiGame.status)) ourStatus = 'SCHEDULED'

                console.log(`💾 [SYNC] ${matchInDb.homeTeam} x ${matchInDb.awayTeam} -> ${apiGame.homeScore}x${apiGame.awayScore} [API: ${apiGame.status} -> DB: ${ourStatus}]`)

                await prisma.match.updateMany({
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

        // 5. RECALCULAR PONTOS (Mantenha igual)
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

        return { success: true, message: `Atualizado! ${gamesUpdatedCount} jogos sincronizados.` }

    } catch (error) {
        console.error("🔥 [ERRO CRÍTICO]:", error)
        return { success: false, message: "Erro interno ao atualizar." }
    }
}