'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function generateReturnRoundsAction(slug: string) {
    try {
        const championship = await prisma.championship.findUnique({
            where: { slug },
            include: { rounds: { include: { duels: true }, orderBy: { createdAt: 'asc' } } }
        })

        if (!championship) return { success: false, message: "Campeonato não encontrado" }

        // Pega as 3 primeiras rodadas (TURNO)
        // Assume que elas estão ordenadas por data de criação
        const turnRounds = championship.rounds.slice(0, 3)

        if (turnRounds.length < 3) return { success: false, message: "Você precisa ter pelo menos 3 rodadas criadas para gerar o returno." }

        let roundsCreated = 0

        // Para cada rodada do turno (1, 2, 3), cria o returno (4, 5, 6)
        for (let i = 0; i < turnRounds.length; i++) {
            const turnRound = turnRounds[i]
            const returnRoundNumber = i + 4 // 1->4, 2->5, 3->6

            // Verifica se essa rodada já existe para não duplicar
            const exists = await prisma.round.findFirst({
                where: {
                    championshipId: championship.id,
                    name: { contains: `Rodada ${returnRoundNumber}` }
                }
            })

            if (exists) continue; // Pula se já existe

            // 1. Cria a Rodada de Volta
            const newRound = await prisma.round.create({
                data: {
                    championshipId: championship.id,
                    name: `Rodada ${returnRoundNumber} - Fase de Grupos`,
                    type: 'GROUP_STAGE',
                    status: 'SCHEDULED', // Começa trancada
                    deadline: new Date(Date.now() + (returnRoundNumber * 7 * 24 * 60 * 60 * 1000)) // +1 semana
                }
            })

            // 2. Copia os duelos INVERTENDO o mando
            for (const duel of turnRound.duels) {
                await prisma.duel.create({
                    data: {
                        roundId: newRound.id,
                        homeParticipantId: duel.awayParticipantId, // Inverte
                        awayParticipantId: duel.homeParticipantId, // Inverte
                        status: 'SCHEDULED'
                    }
                })
            }
            roundsCreated++
        }

        revalidatePath(`/campeonatos/${slug}`)

        if (roundsCreated === 0) {
            return { success: false, message: "As rodadas de returno já existem." }
        }

        return { success: true, message: `✅ Sucesso! ${roundsCreated} rodadas de returno geradas.` }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao gerar returno." }
    }
}