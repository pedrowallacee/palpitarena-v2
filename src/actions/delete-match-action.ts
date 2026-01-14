'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deleteMatchAction(matchId: string, path: string) {
    try {
        // Exclui o jogo (e automaticamente os palpites associados a ele por cascata, se configurado, ou o prisma avisa)
        await prisma.match.delete({
            where: { id: matchId }
        })

        revalidatePath(path)
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir jogo:", error)
        return { success: false, message: "Erro ao excluir. Verifique se já existem palpites computados." }
    }
}