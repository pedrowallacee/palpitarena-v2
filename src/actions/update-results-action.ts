'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculatePoints } from "@/utils/scoring" // Importe a função que criamos acima

const API_KEY = process.env.FOOTBALL_KEY_1
const BASE_URL = "https://v3.football.api-sports.io"

export async function updateRoundResultsAction(roundId: string, slug: string) {
    if (!API_KEY) return { success: false, message: "Sem chave de API." }

    try {
        // 1. Busca jogos da rodada
        const matches = await prisma.match.findMany({
            where: { roundId, apiId: { not: null } },
            include: { predictions: true } // Trazemos os palpites junto
        })

        if (matches.length === 0) return { success: false, message: "Nenhum jogo vinculado à API." }

        let updatedMatches = 0

        for (const match of matches) {
            // Só consulta API se o jogo ainda não acabou ou se queremos atualizar (revisão)
            // if (match.status === 'FINISHED') continue;

            const res = await fetch(`${BASE_URL}/fixtures?id=${match.apiId}`, {
                headers: { "x-apisports-key": API_KEY }
            })

            const data = await res.json()
            const fixtureData = data.response?.[0]

            if (fixtureData) {
                const statusShort = fixtureData.fixture.status.short
                const goals = fixtureData.goals
                const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort)

                // Atualiza o Jogo no Banco
                await prisma.match.update({
                    where: { id: match.id },
                    data: {
                        status: isFinished ? 'FINISHED' : 'LIVE',
                        homeScore: goals.home,
                        awayScore: goals.away,
                    }
                })

                // === A MÁGICA: CALCULAR PONTOS DOS USUÁRIOS ===
                if (goals.home !== null && goals.away !== null) {
                    for (const prediction of match.predictions) {
                        const { points, exactScore } = calculatePoints(
                            prediction.homeScore,
                            prediction.awayScore,
                            goals.home,
                            goals.away
                        )

                        // Atualiza o Palpite individual
                        await prisma.prediction.update({
                            where: { id: prediction.id },
                            data: {
                                pointsEarned: points,
                                exactScore: exactScore,
                                isProcessed: true
                            }
                        })
                    }
                }
                updatedMatches++
            }
        }

        // === PASSO FINAL: ATUALIZAR O RANKING GERAL DO CAMPEONATO ===
        // Isso soma todos os palpites de cada usuário e atualiza a tabela 'ChampionshipParticipant'

        // 1. Pega todos os participantes
        const participants = await prisma.championshipParticipant.findMany({
            where: { championship: { rounds: { some: { id: roundId } } } },
            select: { id: true, userId: true, championshipId: true }
        })

        for (const p of participants) {
            if (!p.userId) continue

            // Soma todos os pontos de palpites desse usuário nesse campeonato
            const totalPoints = await prisma.prediction.aggregate({
                where: {
                    userId: p.userId,
                    match: { round: { championshipId: p.championshipId } }
                },
                _sum: { pointsEarned: true }
            })

            // Conta quantas cravadas
            const totalExacts = await prisma.prediction.count({
                where: {
                    userId: p.userId,
                    match: { round: { championshipId: p.championshipId } },
                    exactScore: true
                }
            })

            // Atualiza a tabela de classificação
            await prisma.championshipParticipant.update({
                where: { id: p.id },
                data: {
                    points: totalPoints._sum.pointsEarned || 0,
                    // Podemos usar o campo 'wins' para guardar Cravadas ou criar um campo novo
                    wins: totalExacts
                }
            })
        }

        revalidatePath(`/campeonatos/${slug}`)
        return { success: true, message: `Resultados e Ranking atualizados!` }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao processar resultados." }
    }
}