'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateScore } from "@/utils/score-rules"

const API_KEY = '35af960ba8f9481ea31323d2947684cb'
const API_HOST = 'v3.football.api-sports.io'

export async function updateRoundResults(roundId: string, slug: string) {
    console.log("🔄 INICIANDO ATUALIZAÇÃO (MODO PLANO GRÁTIS)")

    try {
        // 1. Buscar jogos da rodada no banco
        const matches = await prisma.match.findMany({
            where: {
                roundId,
                apiId: { not: null }
            },
            include: { predictions: true }
        })

        if (matches.length === 0) {
            console.log("❌ NENHUM JOGO COM ID NA RODADA")
            return { success: false, msg: "Sem jogos vinculados à API" }
        }

        // 2. Descobrir quais datas temos nessa rodada
        // (O plano grátis obriga a buscar por data, não por ID múltiplo)
        const uniqueDates = new Set<string>()
        matches.forEach(m => {
            // Pega a parte da data YYYY-MM-DD
            const dateString = m.date.toISOString().split('T')[0]
            uniqueDates.add(dateString)
        })

        console.log(`📅 DATAS ENCONTRADAS: ${Array.from(uniqueDates).join(", ")}`)

        let updatesCount = 0

        // 3. Para cada data, buscamos TODOS os jogos e filtramos os nossos
        for (const date of Array.from(uniqueDates)) {
            console.log(`📡 BUSCANDO JOGOS DO DIA ${date}...`)

            const response = await fetch(`https://${API_HOST}/fixtures?date=${date}&timezone=America/Sao_Paulo`, {
                headers: { 'x-apisports-key': API_KEY }
            })

            const data = await response.json()

            if (data.errors && Object.keys(data.errors).length > 0) {
                console.log(`❌ ERRO NA DATA ${date}:`, data.errors)
                continue
            }

            const apiResults = data.response || []
            console.log(`✅ A API RETORNOU ${apiResults.length} JOGOS PARA ESTA DATA`)

            // 4. Cruzar dados: Procurar nossos jogos na lista da API
            for (const dbMatch of matches) {
                // Tenta achar o jogo correspondente na lista da API pelo ID
                const apiMatch = apiResults.find((m: any) => m.fixture.id === dbMatch.apiId)

                if (apiMatch) {
                    // ACHEI! VAMOS ATUALIZAR
                    const statusShort = apiMatch.fixture.status.short
                    const homeScore = apiMatch.goals.home
                    const awayScore = apiMatch.goals.away

                    console.log(`   > Atualizando: ${dbMatch.homeTeam} x ${dbMatch.awayTeam} | Status: ${statusShort} | Placar: ${homeScore}-${awayScore}`)

                    let dbStatus: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' = 'SCHEDULED'

                    if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(statusShort)) dbStatus = 'LIVE'
                    else if (['FT', 'AET', 'PEN'].includes(statusShort)) dbStatus = 'FINISHED'
                    else if (['PST', 'CANC', 'ABD', 'SUSP', 'INT'].includes(statusShort)) dbStatus = 'POSTPONED'

                    if (dbStatus === 'SCHEDULED') continue;

                    // Atualiza Placar
                    if (homeScore !== null && awayScore !== null) {
                        await prisma.match.update({
                            where: { id: dbMatch.id },
                            data: { status: dbStatus, homeScore, awayScore }
                        })
                        updatesCount++
                    }

                    // Calcula Pontos (Se acabou)
                    if (dbStatus === 'FINISHED' && dbMatch.predictions.length > 0) {
                        for (const prediction of dbMatch.predictions) {
                            if (prediction.isProcessed) continue;

                            const result = calculateScore(prediction.homeScore, prediction.awayScore, homeScore, awayScore)

                            await prisma.prediction.update({
                                where: { id: prediction.id },
                                data: { pointsEarned: result.points, exactScore: result.type === "EXACT", isProcessed: true }
                            })

                            await prisma.user.update({
                                where: { id: prediction.userId },
                                data: { totalPoints: { increment: result.points } }
                            })
                        }
                    }
                }
            }
        }

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, msg: `${updatesCount} jogos atualizados!` }

    } catch (error) {
        console.error("❌ ERRO GERAL:", error)
        return { success: false, msg: "Erro ao atualizar" }
    }
}