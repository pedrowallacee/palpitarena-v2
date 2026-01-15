'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getMatchesByIds } from "@/services/football-api"

export async function addMatchesAction(roundId: string, matchIds: number[]) {
    if (!matchIds || matchIds.length === 0) {
        return { success: false, message: "Nenhum jogo selecionado." }
    }

    try {
        console.log(`📥 [ACTION] Adicionando ${matchIds.length} jogos à rodada ${roundId}...`)

        // 1. Busca detalhes de TODOS os jogos de uma vez (Otimizado)
        const matchesData = await getMatchesByIds(matchIds)

        if (matchesData.length === 0) {
            return { success: false, message: "Erro ao buscar dados dos jogos na API." }
        }

        let addedCount = 0

        // 2. Salva no banco
        for (const match of matchesData) {
            // Verifica se já existe para não duplicar (embora o seletor já filtre)
            const exists = await prisma.match.findUnique({
                where: { apiId: match.apiId }
            })

            if (!exists) {
                await prisma.match.create({
                    data: {
                        apiId: match.apiId,
                        date: new Date(match.date),
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam,
                        homeLogo: match.homeLogo,
                        awayLogo: match.awayLogo,
                        status: 'SCHEDULED', // Força agendado ao criar
                        roundId: roundId
                    }
                })
                addedCount++
            } else {
                // Se o jogo já existe (talvez em outra rodada ou erro),
                // podemos optar por mover ele ou ignorar. Aqui vamos ignorar.
                console.log(`⚠️ Jogo ${match.apiId} já existe no banco.`)
            }
        }

        // 3. Atualiza a tela
        revalidatePath(`/campeonatos`)
        // Dica: Revalidar o caminho geral ajuda a limpar caches persistentes

        return { success: true, message: `${addedCount} jogos adicionados com sucesso!` }

    } catch (error) {
        console.error("🔥 Erro ao adicionar jogos:", error)
        return { success: false, message: "Erro interno ao salvar jogos." }
    }
}