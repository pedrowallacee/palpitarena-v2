'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function joinChampionshipAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) {
        return { success: false, message: "Você precisa fazer login." }
    }

    const championshipId = formData.get("championshipId") as string
    const teamName = formData.get("teamName") as string
    const teamLogo = formData.get("teamLogo") as string
    const teamApiIdString = formData.get("teamApiId") as string
    const teamApiId = teamApiIdString ? parseInt(teamApiIdString) : null

    if (!championshipId || !teamName || !teamApiId) {
        return { success: false, message: "Dados inválidos." }
    }

    try {
        // 1. Verifica se o usuário JÁ está nesse campeonato
        const existingParticipant = await prisma.championshipParticipant.findFirst({
            where: {
                userId: userId,
                championshipId: championshipId
            }
        })

        if (existingParticipant) {
            return { success: false, message: "Você já está participando deste campeonato." }
        }

        // 2. Verifica se o TIME já foi escolhido por outro (Segurança extra de Backend)
        const teamTaken = await prisma.championshipParticipant.findFirst({
            where: {
                championshipId: championshipId,
                teamApiId: teamApiId
            }
        })

        if (teamTaken) {
            return { success: false, message: "Este time já foi escolhido por outro jogador." }
        }

        // 3. Busca o slug do campeonato para redirecionar depois
        const championship = await prisma.championship.findUnique({
            where: { id: championshipId },
            select: { slug: true }
        })

        if (!championship) return { success: false, message: "Campeonato não encontrado." }

        // 4. Cria a participação
        await prisma.championshipParticipant.create({
            data: {
                userId,
                championshipId,
                teamName,
                teamLogo,
                teamApiId,
                points: 0
            }
        })

        revalidatePath(`/campeonatos/${championship.slug}`)
        return { success: true, message: "Bem-vindo ao campeonato!", redirectUrl: `/campeonatos/${championship.slug}` }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao entrar no campeonato." }
    }
}