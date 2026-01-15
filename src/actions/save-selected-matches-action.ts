'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getMatchesByIds } from "@/services/football-api" // Importamos a função de busca

export async function saveSelectedMatches(selectedMatches: any[], roundId: string, slug: string) {
    if (!selectedMatches || selectedMatches.length === 0) {
        return { success: false, error: "Nenhum jogo selecionado." }
    }

    try {
        console.log(`📥 [ACTION] Iniciando salvamento de ${selectedMatches.length} jogos...`)

        // 1. Extrair apenas os IDs dos jogos selecionados
        const ids = selectedMatches.map(m => {
            // Garante que pega o ID correto, seja apiId ou externalId
            return Number(m.apiId || m.externalId)
        }).filter(id => !isNaN(id))

        // 2. Buscar dados FRESCOS na API (Isso traz o horário correto do Brasil)
        // Usamos a função getMatchesByIds que acabamos de corrigir com o timezone
        const freshMatchesData = await getMatchesByIds(ids)

        if (freshMatchesData.length === 0) {
            return { success: false, error: "Erro ao buscar detalhes dos jogos na API." }
        }

        let count = 0;

        // 3. Salvar no Banco
        for (const match of freshMatchesData) {
            // Verifica duplicidade pelo ID da API
            const exists = await prisma.match.findUnique({
                where: { apiId: match.apiId }
            });

            if (!exists) {
                await prisma.match.create({
                    data: {
                        roundId: roundId,
                        apiId: match.apiId,
                        date: new Date(match.date), // A data agora virá certa (fuso Brasil)
                        location: match.leagueName, // Usando nome da liga como local ou pode deixar null
                        status: "SCHEDULED",
                        homeTeam: match.homeTeam,
                        homeLogo: match.homeLogo,
                        awayTeam: match.awayTeam,
                        awayLogo: match.awayLogo,
                    }
                });
                count++;
            } else {
                console.log(`⚠️ Jogo ${match.homeTeam} x ${match.awayTeam} já existe na base.`)
            }
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)

        return { success: true, count }

    } catch (error) {
        console.error("🔥 Erro ao salvar:", error)
        return { success: false, error: "Erro interno ao salvar no banco." }
    }
}