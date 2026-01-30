'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getMatchesByDate, getLiveMatches } from "@/services/football-api"

export async function updateRoundResultsAction(roundId: string, slug: string) {
    console.log("🚀 [DEBUG] Atualizando Rodada - Regra (6-4-3-2-1):", roundId)

    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        // =================================================================================
        // 1. ATUALIZAÇÃO VIA API (MANTIDA)
        // =================================================================================
        const uniqueDates = new Set<string>()
        round.matches.forEach(m => {
            const dateStr = new Date(m.date).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
            uniqueDates.add(dateStr)
        })

        const datesToSearch = new Set<string>()
        uniqueDates.forEach(dateStr => {
            const d = new Date(dateStr + "T12:00:00")
            datesToSearch.add(dateStr)
            const prev = new Date(d); prev.setDate(d.getDate() - 1); datesToSearch.add(prev.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }))
            const next = new Date(d); next.setDate(d.getDate() + 1); datesToSearch.add(next.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }))
        })

        let foundGames: any[] = []
        try {
            for (const date of Array.from(datesToSearch)) {
                const games = await getMatchesByDate(date, 0)
                if (games.length > 0) foundGames = [...foundGames, ...games]
            }
            const liveGames = await getLiveMatches()
            if (liveGames.length > 0) foundGames = [...foundGames, ...liveGames]
        } catch (err) {
            console.error("Erro na API de futebol:", err)
        }

        for (const apiGame of foundGames) {
            const apiIdInt = Number(apiGame.apiId)
            const matchInDb = round.matches.find(m => m.apiId?.toString() === apiIdInt.toString())
            if (matchInDb) {
                let ourStatus = matchInDb.status
                if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(apiGame.status)) ourStatus = 'LIVE'
                if (['FT', 'AET', 'PEN'].includes(apiGame.status)) ourStatus = 'FINISHED'

                await prisma.match.update({
                    where: { id: matchInDb.id },
                    data: { homeScore: apiGame.homeScore, awayScore: apiGame.awayScore, status: ourStatus as any }
                })
            }
        }

        // =================================================================================
        // 2. RECALCULA PONTOS (LÓGICA CORRIGIDA 6-4-3-2-1)
        // =================================================================================
        const updatedRound = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (updatedRound) {
            for (const match of updatedRound.matches) {
                if (match.homeScore !== null && match.awayScore !== null) {

                    const mHome = match.homeScore
                    const mAway = match.awayScore
                    const totalGoals = mHome + mAway // Soma de gols para Super Placar

                    for (const pred of match.predictions) {
                        const pHome = pred.homeScore
                        const pAway = pred.awayScore

                        let points = 0
                        let isExact = false

                        // --- LÓGICA DO USUÁRIO ---

                        // 1. VERIFICA SE CRAVOU (PLACAR EXATO)
                        if (pHome === mHome && pAway === mAway) {
                            isExact = true

                            if (totalGoals >= 5) {
                                // Super Placar (6 pts) - Jogos com mais de 4 gols (5, 6, 7...)
                                // Ex: 3x2, 4x1, 5x0, 3x3
                                points = 6
                            } else if (mHome === mAway) {
                                // Empate Exato (4 pts)
                                // Ex: 0x0, 1x1, 2x2
                                points = 4
                            } else {
                                // Placar Exato Comum (3 pts)
                                // Ex: 1x0, 2x0, 2x1, 3x1, 4x0
                                points = 3
                            }
                        }
                        // 2. NÃO CRAVOU, MAS ACERTOU O RESULTADO?
                        else {
                            const realWinner = mHome > mAway ? 'HOME' : mHome < mAway ? 'AWAY' : 'DRAW'
                            const predWinner = pHome > pAway ? 'HOME' : pHome < pAway ? 'AWAY' : 'DRAW'

                            if (realWinner === predWinner) {
                                if (realWinner === 'DRAW') {
                                    // Empate Simples (2 pts)
                                    // Ex: Jogo 1x1, Palpite 0x0
                                    points = 2
                                } else {
                                    // Vitória Simples (1 pt)
                                    // Ex: Jogo 2x1, Palpite 1x0
                                    points = 1
                                }
                            } else {
                                // Errou tudo (0 pts)
                                points = 0
                            }
                        }

                        // Salva no banco
                        await prisma.prediction.update({
                            where: { id: pred.id },
                            data: {
                                pointsEarned: points,
                                exactScore: isExact,
                                isProcessed: true
                            }
                        })
                    }
                }
            }
        }

        // =================================================================================
        // 3. ATUALIZA DUELOS (X1)
        // =================================================================================
        const currentDuels = await prisma.duel.findMany({ where: { roundId }, include: { homeParticipant: true, awayParticipant: true } })

        for (const duel of currentDuels) {
            if (!duel.homeParticipant.userId || !duel.awayParticipant.userId) continue

            const homePointsAgg = await prisma.prediction.aggregate({ _sum: { pointsEarned: true }, where: { userId: duel.homeParticipant.userId, match: { roundId } } })
            const awayPointsAgg = await prisma.prediction.aggregate({ _sum: { pointsEarned: true }, where: { userId: duel.awayParticipant.userId, match: { roundId } } })

            const finalHome = homePointsAgg._sum?.pointsEarned ?? 0
            const finalAway = awayPointsAgg._sum?.pointsEarned ?? 0

            let winnerId = null
            if (finalHome > finalAway) winnerId = duel.homeParticipantId
            if (finalAway > finalHome) winnerId = duel.awayParticipantId

            await prisma.duel.update({
                where: { id: duel.id },
                data: { homeScore: finalHome, awayScore: finalAway, winnerId: winnerId, status: 'FINISHED' }
            })
        }

        // =================================================================================
        // 4. ATUALIZA TABELAS
        // =================================================================================
        const participants = await prisma.championshipParticipant.findMany({
            where: { championshipId: round.championshipId }
        })

        for (const p of participants) {
            const myDuels = await prisma.duel.findMany({
                where: {
                    OR: [{ homeParticipantId: p.id }, { awayParticipantId: p.id }],
                    status: 'FINISHED'
                }
            })

            let stats = { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 }

            for (const d of myDuels) {
                const isHome = d.homeParticipantId === p.id
                const myScore = isHome ? (d.homeScore || 0) : (d.awayScore || 0)
                const oppScore = isHome ? (d.awayScore || 0) : (d.homeScore || 0)

                stats.J++
                stats.GP += myScore
                stats.GC += oppScore
                if (myScore > oppScore) { stats.P += 3; stats.V++ }
                else if (myScore === oppScore) { stats.P += 1; stats.E++ }
                else { stats.D++ }
            }
            stats.SG = stats.GP - stats.GC

            await prisma.championshipParticipant.update({
                where: { id: p.id },
                data: {
                    points: stats.P, matchesPlayed: stats.J, wins: stats.V, draws: stats.E, losses: stats.D, goalsScored: stats.GP, goalsConceded: stats.GC, goalDifference: stats.SG,
                    groupPoints: stats.P, groupPlayed: stats.J, groupWins: stats.V, groupDraws: stats.E, groupLosses: stats.D, groupGF: stats.GP, groupGC: stats.GC, groupSG: stats.SG
                }
            })
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, message: `✅ Pontos recalculados (Super Placar: 6, Empate: 4, Exato: 3, Empate Simples: 2, Vitória: 1)` }

    } catch (error) {
        console.error("🔥 [ERRO]:", error)
        return { success: false, message: "Erro interno." }
    }
}