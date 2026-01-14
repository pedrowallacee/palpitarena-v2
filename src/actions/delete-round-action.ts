'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function deleteRoundAction(roundId: string) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return { success: false, message: "Não autorizado" }

    try {
        // 1. Verificar permissão (Busca a rodada e o campeonato)
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: { championship: true }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        // Busca usuário para ver se é Admin
        const user = await prisma.user.findUnique({ where: { id: userId } })

        const isOwner = round.championship.ownerId === userId
        const isAdmin = user?.role === 'ADMIN'

        if (!isOwner && !isAdmin) {
            return { success: false, message: "Sem permissão para deletar esta rodada." }
        }

        // 2. Deletar a rodada
        // (O Prisma deleta os jogos e palpites em cascata se configurado, ou deletamos manualmente)
        await prisma.round.delete({
            where: { id: roundId }
        })

        revalidatePath(`/campeonatos/${round.championship.slug}`)
        return { success: true, message: "Rodada excluída com sucesso!" }

    } catch (error) {
        console.error("Erro ao deletar rodada:", error)
        return { success: false, message: "Erro ao deletar. Verifique se existem dados vinculados." }
    }
}