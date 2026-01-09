'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function deleteChampionship(championshipId: string) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return

    // 1. Verifica se o campeonato existe e se o usuário é o dono
    const champ = await prisma.championship.findUnique({
        where: { id: championshipId }
    })

    if (!champ || champ.ownerId !== userId) {
        throw new Error("Você não tem permissão para excluir este campeonato.")
    }

    // 2. Deleta (O 'Cascade' no Prisma já deve cuidar das rodadas/jogos, mas é bom garantir)
    await prisma.championship.delete({
        where: { id: championshipId }
    })

    // 3. Tchau!
    redirect("/dashboard")
}