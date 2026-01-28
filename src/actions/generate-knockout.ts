'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function generateKnockoutAction(championshipId: string) {
    try {
        const championship = await prisma.championship.findUnique({
            where: { id: championshipId },
            include: { participants: true }
        })

        if (!championship) return { success: false, message: "Campeonato não encontrado." }

        // 1. Verificar se é hora do mata-mata
        // (Opcional: verificar se todos os jogos de grupo acabaram, mas vamos deixar o admin forçar)

        // 2. Classificar os times por grupo
        const grouped = championship.participants.reduce((acc: any, p) => {
            const g = p.group
            if (g) {
                if (!acc[g]) acc[g] = []
                acc[g].push(p)
            }
            return acc
        }, {})

        // Ordena cada grupo e pega os 2 melhores
        const qualified: Record<string, any[]> = {}

        for (const groupName of Object.keys(grouped)) {
            const sortedGroup = grouped[groupName].sort((a: any, b: any) => {
                if (b.groupPoints !== a.groupPoints) return b.groupPoints - a.groupPoints
                if (b.groupWins !== a.groupWins) return b.groupWins - a.groupWins
                return b.groupSG - a.groupSG
            })
            // Pega 1º e 2º
            qualified[groupName] = [sortedGroup[0], sortedGroup[1]]
        }

        // Validação: Precisa ter Grupos A, B, C, D para fazer Quartas
        if (!qualified['A'] || !qualified['B'] || !qualified['C'] || !qualified['D']) {
            return { success: false, message: "Erro: Faltam grupos (A, B, C, D) para gerar as Quartas." }
        }

        // 3. Criar a Rodada de Quartas de Final
        const quarterFinals = await prisma.round.create({
            data: {
                championshipId,
                name: "Quartas de Final",
                type: 'QUARTER_FINAL',
                status: 'SCHEDULED',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +1 semana
            }
        })

        // 4. Cruzamento Olímpico (1º A x 2º B, etc)
        const matchups = [
            { home: qualified['A'][0], away: qualified['B'][1] }, // 1º A x 2º B
            { home: qualified['B'][0], away: qualified['A'][1] }, // 1º B x 2º A
            { home: qualified['C'][0], away: qualified['D'][1] }, // 1º C x 2º D
            { home: qualified['D'][0], away: qualified['C'][1] }, // 1º D x 2º C
        ]

        for (const match of matchups) {
            await prisma.duel.create({
                data: {
                    roundId: quarterFinals.id,
                    homeParticipantId: match.home.id,
                    awayParticipantId: match.away.id,
                    status: 'SCHEDULED'
                }
            })
        }

        // Atualiza status do campeonato
        await prisma.championship.update({
            where: { id: championshipId },
            data: {
                status: 'KNOCKOUT',
                currentStage: 'QUARTER_FINAL'
            }
        })

        revalidatePath(`/campeonatos/${championship.slug}`)
        return { success: true, message: "🚀 Quartas de Final geradas com sucesso!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao gerar mata-mata." }
    }
}