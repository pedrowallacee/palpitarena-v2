'use server'

import { getMatchesFromApi } from "@/services/api-football"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function importMatches(formData: FormData) {
    const roundId = formData.get("roundId") as string
    const date = formData.get("date") as string // Formato YYYY-MM-DD
    const slug = formData.get("slug") as string

    if (!roundId || !date) return

    try {
        // 1. Busca na API
        const matches = await getMatchesFromApi(date);

        if (matches.length === 0) {
            console.log("Nenhum jogo importante encontrado nesta data.");
            return;
        }

        // 2. Salva no Banco
        let count = 0;
        for (const match of matches) {
            // Verifica se o jogo já existe nessa rodada para não duplicar
            const exists = await prisma.match.findFirst({
                where: {
                    roundId: roundId,
                    homeTeam: match.teams.home.name,
                    awayTeam: match.teams.away.name
                }
            });

            if (!exists) {
                await prisma.match.create({
                    data: {
                        roundId: roundId,
                        date: new Date(match.fixture.date),
                        location: match.fixture.venue.name || "Estádio Desconhecido",
                        status: "SCHEDULED",
                        homeTeam: match.teams.home.name,
                        homeLogo: match.teams.home.logo,
                        awayTeam: match.teams.away.name,
                        awayLogo: match.teams.away.logo,
                        homeScore: null,
                        awayScore: null
                    }
                });
                count++;
            }
        }

        console.log(`${count} jogos importados com sucesso!`);

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`);

    } catch (error) {
        console.error("Erro ao importar:", error);
    }

    redirect(`/campeonatos/${slug}/rodada/${roundId}`)
}