'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Algoritmo matemático para gerar tabela de 3 rodadas (Ida)
function generateRoundRobinSchedule(participants: string[]) {
    const n = participants.length
    const rounds = []
    const ps = [...participants]

    // Para 4 times = gera 3 rodadas
    for (let r = 0; r < n - 1; r++) {
        const roundMatches = []
        for (let i = 0; i < n / 2; i++) {
            const p1 = ps[i]
            const p2 = ps[n - 1 - i]
            roundMatches.push({ home: p1, away: p2 })
        }
        rounds.push(roundMatches)

        // Rotaciona o array
        ps.splice(1, 0, ps.pop()!)
    }
    return rounds
}

export async function drawGroupsAction(championshipId: string) {
    try {
        const championship = await prisma.championship.findUnique({
            where: { id: championshipId },
            include: { participants: true }
        })

        if (!championship) return { success: false, message: "Campeonato não encontrado." }

        const players = championship.participants

        if (players.length < 4) return { success: false, message: "Mínimo de 4 times para criar grupos." }

        // =========================================================
        // 1. LIMPEZA TOTAL (Resetar tudo antes de sortear)
        // =========================================================

        // Zera estatísticas
        await prisma.championshipParticipant.updateMany({
            where: { championshipId },
            data: {
                group: null,
                groupPoints: 0, groupPlayed: 0, groupWins: 0, groupDraws: 0, groupLosses: 0,
                groupGF: 0, groupGC: 0, groupSG: 0
            }
        })

        // Apaga rodadas antigas de grupos
        await prisma.round.deleteMany({
            where: { championshipId, type: 'GROUP_STAGE' }
        })

        // =========================================================
        // 2. SORTEIO E DISTRIBUIÇÃO NOS GRUPOS
        // =========================================================
        const shuffled = players.sort(() => Math.random() - 0.5)

        const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        const playersPerGroup = 4 // Padrão 4 times por grupo

        const groupsMap: Record<string, string[]> = {}

        for (let i = 0; i < shuffled.length; i++) {
            const groupIndex = Math.floor(i / playersPerGroup)
            const groupName = groupNames[groupIndex] || 'Z'

            await prisma.championshipParticipant.update({
                where: { id: shuffled[i].id },
                data: { group: groupName }
            })

            if (!groupsMap[groupName]) groupsMap[groupName] = []
            groupsMap[groupName].push(shuffled[i].id)
        }

        // =========================================================
        // 3. CRIAÇÃO DAS 6 RODADAS UNIFICADAS
        // =========================================================
        // 3 Rodadas de Ida + 3 Rodadas de Volta = 6 Rodadas Totais

        const globalRoundsIds: string[] = []
        const totalRounds = (playersPerGroup - 1) * 2 // (4-1)*2 = 6

        for (let i = 1; i <= totalRounds; i++) {
            const round = await prisma.round.create({
                data: {
                    championshipId,
                    name: `Rodada ${i} - Fase de Grupos`, // Ex: Rodada 1, Rodada 2... Rodada 6
                    type: 'GROUP_STAGE',
                    status: 'SCHEDULED',
                    deadline: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)) // +1 semana por rodada
                }
            })
            globalRoundsIds.push(round.id)
        }

        // =========================================================
        // 4. PREENCHIMENTO DOS JOGOS (IDA E VOLTA)
        // =========================================================

        for (const [groupName, pIds] of Object.entries(groupsMap)) {
            if (pIds.length < 2) continue;

            // 1. Gera os 3 jogos de IDA (Turno)
            const scheduleIda = generateRoundRobinSchedule(pIds)

            // 2. Gera os 3 jogos de VOLTA (Returno) - Invertendo mando
            const scheduleVolta = scheduleIda.map(matches => {
                return matches.map(m => ({ home: m.away, away: m.home }))
            })

            // 3. Junta tudo em uma lista de 6 rodadas: [R1, R2, R3, R4, R5, R6]
            const fullSchedule = [...scheduleIda, ...scheduleVolta]

            // 4. Salva no banco vinculando às Rodadas Globais
            for (let rIndex = 0; rIndex < fullSchedule.length; rIndex++) {
                const matches = fullSchedule[rIndex]
                const globalRoundId = globalRoundsIds[rIndex]

                if (globalRoundId) {
                    for (const m of matches) {
                        await prisma.duel.create({
                            data: {
                                roundId: globalRoundId,
                                homeParticipantId: m.home,
                                awayParticipantId: m.away,
                                status: 'SCHEDULED'
                            }
                        })
                    }
                }
            }
        }

        // Atualiza status do campeonato
        await prisma.championship.update({
            where: { id: championshipId },
            data: { status: 'GROUP_STAGE', currentStage: 'GROUPS' }
        })

        revalidatePath(`/campeonatos/${championship.slug}`)
        return { success: true, message: "✅ Grupos Sorteados: 6 Rodadas (Ida e Volta) criadas!" }

    } catch (error) {
        console.error("Erro no sorteio:", error)
        return { success: false, message: "Erro ao realizar sorteio." }
    }
}