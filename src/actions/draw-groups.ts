'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// --- ALGORITMO DE TODOS CONTRA TODOS (Round Robin) ---
// Gera os pares: 1x2, 3x4... depois gira e gera 1x3, 2x4...
function generateRoundRobinSchedule(participants: string[]) {
    const n = participants.length
    const rounds = []

    // Se for impar, adiciona um "dummy" (folga), mas vamos focar em pares
    const ps = [...participants]

    // Número de rodadas é N-1 (ex: 4 times = 3 rodadas)
    for (let r = 0; r < n - 1; r++) {
        const roundMatches = []
        for (let i = 0; i < n / 2; i++) {
            const p1 = ps[i]
            const p2 = ps[n - 1 - i]
            roundMatches.push({ home: p1, away: p2 })
        }
        rounds.push(roundMatches)

        // Rotaciona o array (mantém o primeiro fixo e gira o resto)
        // [0, 1, 2, 3] -> [0, 3, 1, 2]
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

        // 1. Limpar dados antigos de grupo (Resetar status)
        await prisma.championshipParticipant.updateMany({
            where: { championshipId },
            data: {
                group: null,
                groupPoints: 0, groupPlayed: 0, groupWins: 0, groupDraws: 0, groupLosses: 0,
                groupGF: 0, groupGC: 0, groupSG: 0
            }
        })

        // Apaga duelos antigos se houver (Opcional, cuidado se já tiver jogo rolando)
        // await prisma.duel.deleteMany({ where: { round: { championshipId } } })

        const players = championship.participants

        // 2. EMBARALHAR (Shuffle)
        const shuffled = players.sort(() => Math.random() - 0.5)

        // =========================================================
        // LÓGICA 1: FASE DE GRUPOS + GERAR JOGOS
        // =========================================================
        if (championship.format === 'GROUPS' || championship.hasGroupStage) {
            const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
            const playersPerGroup = 4 // Padrão FIFA

            // Dicionário para guardar quem ficou em qual grupo
            const groupsMap: Record<string, string[]> = {}

            // 3. Distribui os jogadores nos grupos
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

            // 4. GERAR CONFRONTOS (Quem x Quem)
            // Para cada grupo, gera as rodadas internas
            for (const [groupName, pIds] of Object.entries(groupsMap)) {
                if (pIds.length < 2) continue; // Grupo com 1 pessoa não tem jogo

                // Gera a tabela de jogos matemática
                const schedule = generateRoundRobinSchedule(pIds)

                // Salva no Banco
                for (let rIndex = 0; rIndex < schedule.length; rIndex++) {
                    const matches = schedule[rIndex]
                    const roundNumber = rIndex + 1

                    // Cria ou busca a Rodada "Fase de Grupos - Rodada X"
                    // Nota: O ideal é criar a Rodada Global antes, mas aqui vamos simplificar
                    // Vamos criar uma rodada genérica para o grupo se não existir

                    // PROCURA SE JÁ EXISTE UMA RODADA PARA ESSE NÚMERO
                    let round = await prisma.round.findFirst({
                        where: {
                            championshipId,
                            name: `Rodada ${roundNumber} - Grupos`
                        }
                    })

                    if (!round) {
                        round = await prisma.round.create({
                            data: {
                                championshipId,
                                name: `Rodada ${roundNumber} - Grupos`,
                                type: 'GROUP_STAGE',
                                status: 'SCHEDULED',
                                deadline: new Date(Date.now() + (roundNumber * 7 * 24 * 60 * 60 * 1000)) // +1 semana por rodada
                            }
                        })
                    }

                    // Cria os Duelos (PvP)
                    for (const m of matches) {
                        await prisma.duel.create({
                            data: {
                                roundId: round.id,
                                homeParticipantId: m.home,
                                awayParticipantId: m.away,
                                status: 'SCHEDULED'
                            }
                        })
                    }
                }
            }

            // Muda status
            await prisma.championship.update({
                where: { id: championshipId },
                data: {
                    status: 'GROUP_STAGE',
                    currentStage: 'GROUPS'
                }
            })

            revalidatePath(`/campeonatos/${championship.slug}`)
            return { success: true, message: "🎲 Grupos sorteados e Tabela de Jogos criada!" }
        }

        // =========================================================
        // LÓGICA 2: MATA-MATA DIRETO
        // =========================================================
        if (championship.format === 'KNOCKOUT') {
            const round = await prisma.round.create({
                data: {
                    championshipId,
                    name: "Oitavas de Final", // Exemplo
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    type: 'ROUND_OF_16',
                    status: 'OPEN'
                }
            })

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
                data: { status: 'KNOCKOUT', currentStage: 'ROUND_OF_16' }
            })

            revalidatePath(`/campeonatos/${championship.slug}`)
            return { success: true, message: "🥊 Mata-mata sorteado!" }
        }

        return { success: false, message: "Formato desconhecido." }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao realizar sorteio." }
    }
}