'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// --- HELPER FUNCTIONS ---
function generateSlug(text: string) {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-")
        .concat(`-${Math.floor(Math.random() * 1000)}`)
}

function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// 1. DASHBOARD
export async function getAdminDashboardData() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) throw new Error("Não autenticado")

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== 'ADMIN') throw new Error("Acesso negado")

    const pendingRequests = await prisma.championshipRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    })

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return { pendingRequests, users }
}

export async function approveRequestAction(requestId: string) {
    try {
        const request = await prisma.championshipRequest.findUnique({ where: { id: requestId } })
        if (!request) return { success: false, message: "Solicitação não encontrada" }

        const slug = generateSlug(request.name)
        const code = generateInviteCode()

        const leagueIdMap: Record<string, number> = {
            "Brasileirão Série A": 71, "Premier League": 39, "Champions League": 2,
            "Libertadores": 13, "Copa do Brasil": 73, "La Liga": 140,
            "Serie A Tim": 135, "Bundesliga": 78, "Ligue 1": 61,
            "Liga Portugal": 94, "Saudi Pro League": 307, "MLS": 253,
            "Liga Profissional Arg": 128, "Eredivisie": 88
        }
        const apiLeagueId = leagueIdMap[request.leagueType] || 71

        await prisma.championship.create({
            data: {
                name: request.name,
                slug,
                code,
                leagueType: request.leagueType,
                status: 'ACTIVE',
                adminPhone: request.whatsapp,
                ownerId: request.userId,
                apiLeagueId: apiLeagueId,
                format: 'POINTS',
                maxParticipants: 20
            }
        })

        await prisma.championshipRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' }
        })

        revalidatePath("/admin")
        return { success: true, message: "✅ Campeonato aprovado e criado!" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao aprovar." }
    }
}

export async function rejectRequestAction(requestId: string) {
    await prisma.championshipRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
    })
    revalidatePath("/admin")
    return { success: true, message: "Solicitação rejeitada." }
}

export async function toggleUserRoleAction(targetUserId: string, currentRole: 'USER' | 'ADMIN') {
    const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER'
    await prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole }
    })
    revalidatePath("/admin")
    return { success: true, message: `Usuário agora é ${newRole}` }
}

// =========================================================
// 3. FUNÇÕES DE RODADA
// =========================================================

export async function updateMatchResultAction(matchId: string, home: number, away: number) {
    try {
        await prisma.match.update({
            where: { id: matchId },
            data: {
                resultHome: home,
                resultAway: away,
                homeScore: home,
                awayScore: away
            }
        })
        revalidatePath('/', 'layout') // Força atualização total
        return { success: true }
    } catch (error) {
        return { success: false, message: "Erro ao atualizar placar" }
    }
}

export async function closeRoundAction(roundId: string) {
    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: {
                matches: { include: { predictions: true } },
                championship: { include: { participants: true } }
            }
        })

        if (!round) return { success: false, message: "Rodada não encontrada" }

        const userPoints: Record<string, { points: number, exact: number }> = {}

        round.championship.participants.forEach(p => {
            if (p.userId) userPoints[p.userId] = { points: 0, exact: 0 }
        })

        for (const match of round.matches) {
            if (match.resultHome === null || match.resultAway === null) continue;

            const realHome = match.resultHome
            const realAway = match.resultAway
            const realDiff = realHome - realAway
            const realWinner = realDiff > 0 ? 'HOME' : realDiff < 0 ? 'AWAY' : 'DRAW'

            for (const pred of match.predictions) {
                if (!userPoints[pred.userId]) userPoints[pred.userId] = { points: 0, exact: 0 }

                let points = 0
                if (pred.homeScore === realHome && pred.awayScore === realAway) {
                    points = 25; userPoints[pred.userId].exact += 1
                } else if ((pred.homeScore - pred.awayScore === realDiff) &&
                    ((pred.homeScore > pred.awayScore) === (realHome > realAway))) {
                    points = 15
                } else if ((pred.homeScore > pred.awayScore && realHome > realAway) ||
                    (pred.homeScore < pred.awayScore && realHome < realAway) ||
                    (pred.homeScore === pred.awayScore && realHome === realAway)) {
                    points = 10
                } else if (pred.homeScore === realHome || pred.awayScore === realAway) {
                    points = 5
                }
                userPoints[pred.userId].points += points
            }
        }

        for (const [userId, stats] of Object.entries(userPoints)) {
            const participant = round.championship.participants.find(p => p.userId === userId)
            if (participant) {
                await prisma.championshipParticipant.update({
                    where: { id: participant.id },
                    data: {
                        points: { increment: stats.points },
                        exactScores: { increment: stats.exact },
                        matchesPlayed: { increment: round.matches.length }
                    }
                })
            }
            await prisma.user.update({
                where: { id: userId },
                data: { globalPoints: { increment: stats.points } }
            })
        }

        await prisma.round.update({ where: { id: roundId }, data: { status: 'FINISHED' } })

        // REVALIDAÇÃO FORTE
        const slug = round.championship.slug
        revalidatePath(`/campeonatos/${slug}`)
        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao fechar rodada." }
    }
}

// --- SYNC API (COM REVALIDAÇÃO CORRETA) ---
export async function syncRoundWithApiAction(roundId: string) {
    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: {
                matches: true,
                championship: true // <--- Incluímos para pegar o Slug
            }
        })

        if (!round) return { success: false, message: "Rodada não encontrada." }

        const matchesWithApi = round.matches.filter(m => m.apiId !== null && m.apiId > 0)

        if (matchesWithApi.length === 0) return { success: false, message: "Nenhum jogo vinculado à API." }

        const apiKey = process.env.FOOTBALL_KEY_1 || process.env.FOOTBALL_KEY_2 || process.env.FOOTBALL_KEY_3 || process.env.API_FOOTBALL_KEY
        if (!apiKey) return { success: false, message: "API Key não encontrada." }

        let updatedCount = 0

        for (const match of matchesWithApi) {

            await new Promise(resolve => setTimeout(resolve, 250));

            const response = await fetch(`https://v3.football.api-sports.io/fixtures?id=${match.apiId}`, {
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': apiKey,
                    'x-apisports-key': apiKey
                },
                cache: 'no-store'
            })

            const data = await response.json()

            if (!data.response || data.response.length === 0) continue;

            const fixture = data.response[0]
            const goals = fixture.goals
            const status = fixture.fixture.status.short

            if (goals.home !== null && goals.away !== null) {
                await prisma.match.update({
                    where: { id: match.id },
                    data: {
                        resultHome: goals.home,
                        resultAway: goals.away,
                        homeScore: goals.home,
                        awayScore: goals.away,
                        status: ['FT', 'AET', 'PEN'].includes(status) ? 'FINISHED' : 'LIVE'
                    }
                })
                updatedCount++
            }
        }

        // --- O PULO DO GATO: Revalida a página exata do campeonato ---
        if (round.championship?.slug) {
            revalidatePath(`/campeonatos/${round.championship.slug}`)
        }
        revalidatePath('/', 'layout') // Garante que tudo atualize

        if (updatedCount === 0) {
            return { success: false, message: "Conectou à API, mas nenhum jogo tinha placar finalizado ainda." }
        }

        return { success: true, message: `Sincronizado! ${updatedCount} jogos atualizados.` }

    } catch (error) {
        console.error("Sync Error:", error)
        return { success: false, message: "Erro interno ao sincronizar." }
    }
}