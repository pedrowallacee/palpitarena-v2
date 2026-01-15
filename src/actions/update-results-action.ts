'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculatePoints } from "@/utils/scoring"
import { getMatchesByDate, getLiveMatches } from "@/services/football-api"

export async function updateRoundResultsAction(roundId: string, slug: string) {
    console.log("🚀 [DEBUG] Iniciando atualização (MODO LIGA COMPLETA):", roundId)

    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { matches: { include: { predictions: true } } }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        // --- 1. BUSCA DADOS NA API E ATUALIZA JOGOS (Blindagem de Data) ---
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

        // Atualiza placares no banco
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

        // --- 2. RECALCULA PONTOS DOS PALPITES ---
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
        // 🏆 AQUI É A MÁGICA: TABELA COMPLETA (P, J, V, E, D, GP, GC, SG)
        // =================================================================================

        console.log("⚔️ [LIGA] Processando Duelos e Estatísticas...")

        // A. Primeiro, atualiza o placar DO DUELO ATUAL (Ex: 9 x 4)
        const currentDuels = await prisma.duel.findMany({ where: { roundId }, include: { homeParticipant: true, awayParticipant: true } })

        for (const duel of currentDuels) {
            const homePoints = await prisma.prediction.aggregate({ _sum: { pointsEarned: true }, where: { userId: duel.homeParticipant.userId, match: { roundId } } })
            const awayPoints = await prisma.prediction.aggregate({ _sum: { pointsEarned: true }, where: { userId: duel.awayParticipant.userId, match: { roundId } } })

            await prisma.duel.update({
                where: { id: duel.id },
                data: { homeScore: homePoints._sum.pointsEarned || 0, awayScore: awayPoints._sum.pointsEarned || 0 }
            })
        }

        // B. Agora, RECALCULA A TABELA INTEIRA (do zero, para garantir que não tenha erro)
        // Pegamos todos os participantes do campeonato
        const participants = await prisma.championshipParticipant.findMany({
            where: { championshipId: round.championshipId }
        })

        for (const p of participants) {
            // Busca TODOS os duelos desse cara que JÁ TERMINARAM (têm placar)
            // Isso inclui a rodada atual e as passadas
            const myDuels = await prisma.duel.findMany({
                where: {
                    OR: [{ homeParticipantId: p.id }, { awayParticipantId: p.id }],
                    homeScore: { not: null },
                    awayScore: { not: null }
                }
            })

            // Zera as estatísticas para recalcular
            let stats = {
                P: 0,  // Pontos (3, 1, 0)
                J: 0,  // Jogos
                V: 0,  // Vitórias
                E: 0,  // Empates
                D: 0,  // Derrotas
                GP: 0, // Gols Pró (Pontos de palpite feitos)
                GC: 0, // Gols Contra (Pontos de palpite sofridos)
                SG: 0  // Saldo
            }

            for (const d of myDuels) {
                const isHome = d.homeParticipantId === p.id
                const myScore = isHome ? (d.homeScore || 0) : (d.awayScore || 0) // Meus pontos na rodada
                const oppScore = isHome ? (d.awayScore || 0) : (d.homeScore || 0) // Pontos dele

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
                    // Derrota não ganha ponto
                    stats.D++
                }
            }

            stats.SG = stats.GP - stats.GC

            // Salva no banco a tabela atualizada
            await prisma.championshipParticipant.update({
                where: { id: p.id },
                data: {
                    points: stats.P,
                    matchesPlayed: stats.J,
                    wins: stats.V,
                    draws: stats.E,
                    losses: stats.D,
                    goalsScored: stats.GP,
                    goalsConceded: stats.GC,
                    goalDifference: stats.SG
                }
            })
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, message: `Tabela Atualizada! Classificação recalculada.` }

    } catch (error) {
        console.error("🔥 [ERRO CRÍTICO]:", error)
        return { success: false, message: "Erro interno." }
    }
}