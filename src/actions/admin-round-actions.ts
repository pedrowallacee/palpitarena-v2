'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// 1. EXCLUIR RODADA INTEIRA
export async function deleteRoundAction(roundId: string, slug: string) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) return { success: false, message: "Não autorizado." }

    try {
        // Verifica se é admin/dono
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { championship: true }
        })

        if (!round || round.championship.ownerId !== userId) {
            return { success: false, message: "Sem permissão." }
        }

        // Deleta (O Cascade do banco já deve apagar os jogos e palpites, mas por segurança...)
        await prisma.round.delete({ where: { id: roundId } })

        revalidatePath(`/campeonatos/${slug}`)
        return { success: true, message: "Rodada excluída." }
    } catch (error) {
        return { success: false, message: "Erro ao excluir." }
    }
}

// 2. REMOVER UM JOGO ESPECÍFICO
export async function removeMatchAction(matchId: string, roundId: string, slug: string) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) return { success: false, message: "Não autorizado." }

    try {
        // Verifica permissão (buscando via round->championship)
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { round: { include: { championship: true } } }
        })

        if (!match || match.round.championship.ownerId !== userId) {
            return { success: false, message: "Sem permissão." }
        }

        await prisma.match.delete({ where: { id: matchId } })

        revalidatePath(`/campeonatos/${slug}/rodada/${roundId}`)
        return { success: true, message: "Jogo removido." }
    } catch (error) {
        return { success: false, message: "Erro ao remover jogo." }
    }
}