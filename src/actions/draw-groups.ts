'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function drawGroupsAction(championshipId: string) {
    try {
        // 1. Busca todos os participantes do campeonato
        const participants = await prisma.championshipParticipant.findMany({
            where: { championshipId },
            select: { id: true } // Só precisamos do ID para atualizar
        })

        if (participants.length < 4) {
            return { success: false, message: "Mínimo de 4 participantes para sortear!" }
        }

        // 2. Algoritmo de Embaralhamento (Fisher-Yates Shuffle)
        // Isso garante que o sorteio seja justo e aleatório
        const shuffled = [...participants]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 3. Distribuição nos Grupos (A, B, C, D...)
        // Vamos assumir grupos de 4 pessoas por padrão
        const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"]
        const updates = []

        // Define quantos grupos teremos
        const totalGroups = Math.ceil(shuffled.length / 4)

        for (let i = 0; i < shuffled.length; i++) {
            // Calcula o índice do grupo: 0, 1, 2, 3...
            const groupIndex = i % totalGroups
            const groupName = groupNames[groupIndex]

            // Prepara a atualização no banco
            updates.push(
                prisma.championshipParticipant.update({
                    where: { id: shuffled[i].id },
                    data: { group: groupName }
                })
            )
        }

        // 4. Executa tudo numa transação (ou tudo dá certo, ou nada muda)
        await prisma.$transaction(updates)

        // 5. Atualiza o status do campeonato para "Fase de Grupos"
        await prisma.championship.update({
            where: { id: championshipId },
            data: { status: 'GROUP_STAGE' }
        })

        revalidatePath(`/campeonatos/[slug]`)
        return { success: true, message: "Grupos sorteados com sucesso!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao realizar sorteio." }
    }
}