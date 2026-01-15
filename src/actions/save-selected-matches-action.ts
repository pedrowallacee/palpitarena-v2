'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getMatchesByIds } from "@/services/football-api"

export async function saveSelectedMatches(selectedMatches: any[], roundId: string, slug: string) {
    if (!selectedMatches || selectedMatches.length === 0) {
        return { success: false, error: "Nenhum jogo selecionado." }
    }

    try {
        console.log(`📥 [ACTION] Tentando salvar ${selectedMatches.length} jogos...`)

        const ids = selectedMatches.map(m => Number(m.apiId || m.externalId)).filter(id => !isNaN(id))

        // 1. Tenta buscar dados FRESCOS na API (Prioridade)
        let matchesToSave = await getMatchesByIds(ids)

        // 2. FALLBACK (Plano B): Se a API falhar ou retornar vazio, usa os dados do Frontend
        if (matchesToSave.length === 0) {
            console.warn("⚠️ [AVISO] Falha ao revalidar na API. Usando dados enviados pelo navegador (Fallback).")
            matchesToSave = selectedMatches
        }

        let count = 0;

        // 3. Salvar no Banco
        for (const match of matchesToSave) {
            const exists = await prisma.match.findUnique({
                where: { apiId: match.apiId }
            });

            if (!exists) {
                // Tratamento de segurança para a data
                // Se a data vier como string, garantimos que o new Date interprete corretamente
                const gameDate = new Date(match.date)

                await prisma.match.create({
                    data: {
                        roundId: roundId,
                        apiId: match.apiId,
                        date: gameDate,
                        location: match.leagueName || match.league,
                        status: "SCHEDULED",
                        homeTeam: match.homeTeam,
                        homeLogo: match.homeLogo,
                        awayTeam: match.awayTeam,
                        awayLogo: match.awayLogo,
                    }
                });
                count++;
            }
        }

        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)

        return { success: true, count }

    } catch (error) {
        console.error("🔥 Erro crítico ao salvar:", error)
        // Mesmo com erro, tentamos retornar algo útil se possível, ou mensagem genérica
        return { success: false, error: "Erro interno ao salvar no banco." }
    }
}