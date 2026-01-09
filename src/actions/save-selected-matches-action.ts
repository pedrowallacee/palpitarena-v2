'use server'
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveSelectedMatches(selectedMatches: any[], roundId: string, slug: string) {
    try {
        let count = 0;

        for (const match of selectedMatches) {
            // Verifica duplicidade pelo ID da API (Muito mais seguro)
            const exists = await prisma.match.findFirst({
                where: { apiId: match.apiId }
            });

            if (!exists) {
                await prisma.match.create({
                    data: {
                        roundId: roundId,
                        apiId: match.apiId, // <--- SALVANDO O ID AGORA
                        date: new Date(match.date),
                        location: match.location,
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

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, count }

    } catch (error) {
        console.error("Erro ao salvar:", error)
        return { success: false, error: "Erro ao salvar no banco" }
    }
}