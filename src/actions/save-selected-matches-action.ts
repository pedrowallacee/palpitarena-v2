'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getMatchesByIds } from "@/services/football-api"

export async function saveSelectedMatches(selectedMatches: any[], roundId: string, slug: string) {
    if (!selectedMatches || selectedMatches.length === 0) {
        return { success: false, error: "Nenhum jogo selecionado." }
    }

    try {
        console.log(`📥 [ACTION] Processando ${selectedMatches.length} jogos...`)

        // 1. Prepara os IDs para buscar na API
        const ids = selectedMatches
            .map(m => Number(m.apiId || m.externalId))
            .filter(id => !isNaN(id))

        // 2. Busca dados FRESCOS na API
        const apiMatches = await getMatchesByIds(ids)

        let savedCount = 0

        // 3. Itera sobre OS JOGOS SELECIONADOS (Garante que passamos por todos)
        for (const selection of selectedMatches) {
            const apiId = Number(selection.apiId || selection.externalId)

            // Tenta achar dados novos da API; se não tiver, usa o que veio da tela (Fallback)
            const matchData = apiMatches.find(m => m.apiId === apiId) || selection

            // Garante data válida
            const gameDate = new Date(matchData.date)

            // Verifica se o jogo já existe no banco
            const existingMatch = await prisma.match.findUnique({
                where: { apiId: apiId }
            })

            if (existingMatch) {
                // CENÁRIO A: Jogo já existe (estava numa rodada antiga ou duplicado)
                // AÇÃO: Movemos ele para a rodada atual e atualizamos os dados
                console.log(`♻️ Jogo ${apiId} já existia. Movendo para a rodada ${roundId}...`)

                await prisma.match.update({
                    where: { id: existingMatch.id },
                    data: {
                        roundId: roundId, // <--- AQUI ESTÁ O PULO DO GATO (Traz para a rodada atual)
                        date: gameDate,
                        status: existingMatch.status === 'FINISHED' ? 'FINISHED' : 'SCHEDULED', // Preserva status se já acabou
                        homeScore: existingMatch.status === 'FINISHED' ? existingMatch.homeScore : null,
                        awayScore: existingMatch.status === 'FINISHED' ? existingMatch.awayScore : null
                    }
                })
                savedCount++

            } else {
                // CENÁRIO B: Jogo novo
                // AÇÃO: Cria do zero
                await prisma.match.create({
                    data: {
                        roundId: roundId,
                        apiId: apiId,
                        date: gameDate,
                        location: matchData.leagueName || matchData.league,
                        status: "SCHEDULED",
                        homeTeam: matchData.homeTeam,
                        homeLogo: matchData.homeLogo,
                        awayTeam: matchData.awayTeam,
                        awayLogo: matchData.awayLogo,
                    }
                })
                savedCount++
            }
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)

        return { success: true, count: savedCount }

    } catch (error) {
        console.error("🔥 Erro crítico ao salvar:", error)
        return { success: false, error: "Erro interno ao salvar no banco." }
    }
}