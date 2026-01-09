'use server'

import { getMatchesByDate } from "@/services/football-api"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function importMatches(formData: FormData) {
    const roundId = formData.get("roundId") as string
    const date = formData.get("date") as string
    const slug = formData.get("slug") as string

    if (!roundId || !date) return

    try {
        const matches = await getMatchesByDate(date);

        if (matches.length === 0) {
            console.log("Nenhum jogo encontrado nesta data.");
            return;
        }

        let count = 0;
        for (const match of matches) {
            const exists = await prisma.match.findFirst({
                where: {
                    apiId: match.apiId
                }
            });

            if (!exists) {
                await prisma.match.create({
                    data: {
                        apiId: match.apiId,
                        roundId: roundId,
                        date: new Date(match.date),
                        location: "Estádio",
                        status: "SCHEDULED",
                        homeTeam: match.homeTeam,
                        homeLogo: match.homeTeamLogo,
                        awayTeam: match.awayTeam,
                        awayLogo: match.awayTeamLogo,
                        homeScore: null,
                        awayScore: null
                    }
                });
                count++;
            }
        }

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`);

    } catch (error) {
        console.error("Erro ao importar:", error);
    }

    redirect(`/campeonatos/${slug}/rodada/${roundId}`)
}