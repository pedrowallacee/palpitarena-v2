'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculatePoints } from "@/utils/scoring"
import { getMatchesByDate, getLiveMatches } from "@/services/football-api"

export async function updateRoundResultsAction(roundId: string, slug: string) {
    console.log("🚀 [DEBUG] Atualizando Rodada e Grupos:", roundId)

    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        // =================================================================================
        // 1. ATUALIZAÇÃO VIA API (MANTIDA IGUAL AO SEU)
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
        for (const date of Array.from(datesToSearch)) {
            const games = await getMatchesByDate(date, 0)
            if (games.length > 0) foundGames = [...foundGames, ...games]
        }
        const liveGames = await getLiveMatches()
        if (liveGames.length > 0) foundGames = [...foundGames, ...liveGames]

        // Atualiza placares dos Jogos
        for (const apiGame of foundGames) {
            const apiIdInt = Number(apiGame.apiId)
            const matchInDb = round.matches.find(m => m.apiId?.toString() === apiIdInt.toString())
            if (matchInDb) {
                let ourStatus = 'SCHEDULED'
                if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(apiGame.status)) ourStatus = 'LIVE'
                if (['FT', 'AET', 'PEN'].includes(apiGame.status)) ourStatus = 'FINISHED'

                await prisma.match.updateMany({
                    where: { apiId: apiIdInt },
                    data: { homeScore: apiGame.homeScore, awayScore: apiGame.awayScore, status: ourStatus as any }
                })
            }
        }

        // =================================================================================
        // 2. RECALCULA PONTOS DOS PALPITES
        // =================================================================================
        const updatedRound = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (updatedRound) {
            for (const match of updatedRound.matches) {
                if (match.homeScore !== null && match.awayScore !== null) {
                    for (const prediction of match.predictions) {
                        const result = calculatePoints(match.homeScore, match.awayScore, prediction.homeScore, prediction.awayScore)
                        await prisma.prediction.update({
                            where: { id: prediction.id },
                            data: { pointsEarned: result.points, exactScore: result.type.includes('EXACT') || result.type === 'OUSADO', isProcessed: true }
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

            const homePoints = await prisma.prediction.aggregate({ _sum: { pointsEarned: true }, where: { userId: duel.homeParticipant.userId, match: { roundId } } })
            const awayPoints = await prisma.prediction.aggregate({ _sum: { pointsEarned: true }, where: { userId: duel.awayParticipant.userId, match: { roundId } } })

            const finalHome = homePoints._sum?.pointsEarned ?? 0
            const finalAway = awayPoints._sum?.pointsEarned ?? 0

            // Define vencedor para ficar bonito no banco
            let winnerId = null
            if (finalHome > finalAway) winnerId = duel.homeParticipantId
            if (finalAway > finalHome) winnerId = duel.awayParticipantId

            await prisma.duel.update({
                where: { id: duel.id },
                data: {
                    homeScore: finalHome,
                    awayScore: finalAway,
                    winnerId: winnerId,
                    status: 'FINISHED'
                }
            })
        }

        // =================================================================================
        // 4. ATUALIZA TABELA GERAL E TABELA DE GRUPOS (AQUI ESTAVA O ERRO)
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

                if (myScore > oppScore) {
                    stats.P += 3
                    stats.V++
                } else if (myScore === oppScore) {
                    stats.P += 1
                    stats.E++
                } else {
                    stats.D++
                }
            }
            stats.SG = stats.GP - stats.GC

            // 🔥 ATUALIZAÇÃO DUPLA (Geral + Grupo) 🔥
            await prisma.championshipParticipant.update({
                where: { id: p.id },
                data: {
                    // Dados Gerais (Legado)
                    points: stats.P,
                    matchesPlayed: stats.J,
                    wins: stats.V,
                    draws: stats.E,
                    losses: stats.D,
                    goalsScored: stats.GP,
                    goalsConceded: stats.GC,
                    goalDifference: stats.SG,

                    // Dados de Grupo (Novo Leaderboard precisa disso!)
                    groupPoints: stats.P,
                    groupPlayed: stats.J,
                    groupWins: stats.V,
                    groupDraws: stats.E,
                    groupLosses: stats.D,
                    groupGF: stats.GP,
                    groupGC: stats.GC,
                    groupSG: stats.SG
                }
            })
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, message: `Resultados processados e Tabelas (Geral e Grupo) atualizadas!` }

    } catch (error) {
        console.error("🔥 [ERRO CRÍTICO]:", error)
        return { success: false, message: "Erro interno." }
    }
}