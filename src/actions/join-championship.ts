'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function joinChampionshipAction(formData: FormData) {
    const championshipId = formData.get("championshipId") as string
    const teamApiId = formData.get("teamApiId") as string
    const teamName = formData.get("teamName") as string
    const teamLogo = formData.get("teamLogo") as string

    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) {
        return { success: false, message: "Usuário não logado." }
    }

    try {
        // 1. Verifica se o time já foi pego por outra pessoa (segurança extra)
        const isTaken = await prisma.championshipParticipant.findFirst({
            where: {
                championshipId,
                teamApiId: Number(teamApiId)
            }
        })

        if (isTaken) {
            return { success: false, message: "Este time já foi escolhido por outro jogador." }
        }

        // 2. Cria a participação
        await prisma.championshipParticipant.create({
            data: {
                userId,
                championshipId,
                teamName,
                teamLogo,
                teamApiId: Number(teamApiId),
                // Inicializa zerado, a tabela calcula depois
                points: 0
            }
        })

        // 3. Busca o slug para redirecionar
        const camp = await prisma.championship.findUnique({
            where: { id: championshipId },
            select: { slug: true }
        })

        revalidatePath(`/campeonatos/${camp?.slug}`)

    } catch (error) {
        console.error("Erro ao entrar no campeonato:", error)
        return { success: false, message: "Erro ao salvar escolha." }
    }

    // Se tudo der certo, redireciona para a dashboard do campeonato
    // (Buscamos o slug ali em cima)
    const camp = await prisma.championship.findUnique({ where: { id: championshipId } })
    if (camp) {
        redirect(`/campeonatos/${camp.slug}`)
    }
}