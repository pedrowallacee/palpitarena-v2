'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function drawGroupsAction(championshipId: string) {
    try {
        const championship = await prisma.championship.findUnique({
            where: { id: championshipId },
            include: { participants: true }
        })

        if (!championship) return { success: false, message: "Campeonato não encontrado." }

        const players = championship.participants

        // 1. EMBARALHAR (Shuffle) - Para o sorteio ser aleatório
        const shuffled = players.sort(() => Math.random() - 0.5)

        // LÓGICA 1: FASE DE GRUPOS (Estilo Copa do Mundo)
        if (championship.format === 'GROUPS') {
            const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
            const playersPerGroup = 4 // Padrão FIFA

            // Distribui os jogadores
            for (let i = 0; i < shuffled.length; i++) {
                const groupIndex = Math.floor(i / playersPerGroup)
                const groupName = groupNames[groupIndex] || 'Z' // Fallback se tiver gente demais

                await prisma.championshipParticipant.update({
                    where: { id: shuffled[i].id },
                    data: { group: groupName }
                })
            }

            // Muda status para Fase de Grupos
            await prisma.championship.update({
                where: { id: championshipId },
                data: { status: 'GROUP_STAGE' }
            })

            revalidatePath(`/campeonatos/${championship.slug}`)
            return { success: true, message: "🎲 Grupos sorteados com sucesso!" }
        }

        // LÓGICA 2: MATA-MATA (Cria Duelos Iniciais)
        if (championship.format === 'KNOCKOUT') {
            // Cria a 1ª Rodada de Mata-mata
            const round = await prisma.round.create({
                data: {
                    championshipId,
                    name: "Rodada 1 - Eliminatória",
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
                    type: 'ROUND_OF_16', // Exemplo genérico
                    status: 'OPEN'
                }
            })

            // Cria os duelos (1 vs 2, 3 vs 4...)
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    await prisma.duel.create({
                        data: {
                            roundId: round.id,
                            homeParticipantId: shuffled[i].id,
                            awayParticipantId: shuffled[i + 1].id,
                            status: 'SCHEDULED'
                        }
                    })
                }
            }

            await prisma.championship.update({
                where: { id: championshipId },
                data: { status: 'KNOCKOUT' }
            })

            revalidatePath(`/campeonatos/${championship.slug}`)
            return { success: true, message: "🥊 Chaves definidas e 1ª Rodada criada!" }
        }

        return { success: false, message: "Formato de pontos corridos não precisa de sorteio." }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao realizar sorteio." }
    }
}