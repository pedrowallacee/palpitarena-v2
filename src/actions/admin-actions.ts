'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// --- HELPER FUNCTIONS (Copiadas para garantir funcionamento isolado) ---
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

// 1. BUSCAR DADOS DO DASHBOARD
export async function getAdminDashboardData() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) throw new Error("Não autenticado")

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== 'ADMIN') throw new Error("Acesso negado")

    // Busca solicitações pendentes
    const pendingRequests = await prisma.championshipRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    })

    // Busca todos os usuários (exceto o próprio admin logado para evitar auto-remoção acidental)
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50 // Limite para não travar se tiver mil users
    })

    return { pendingRequests, users }
}

// 2. APROVAR SOLICITAÇÃO (Cria o Campeonato)
export async function approveRequestAction(requestId: string) {
    try {
        const request = await prisma.championshipRequest.findUnique({ where: { id: requestId } })
        if (!request) return { success: false, message: "Solicitação não encontrada" }

        const slug = generateSlug(request.name)
        const code = generateInviteCode()

        // Mapeamento de IDs (Copie o objeto LEAGUE_IDS aqui se não conseguir importar)
        const leagueIdMap: Record<string, number> = {
            "Brasileirão Série A": 71, "Premier League": 39, "Champions League": 2,
            "Libertadores": 13, "Copa do Brasil": 73, "La Liga": 140,
            "Serie A Tim": 135, "Bundesliga": 78, "Ligue 1": 61,
            "Liga Portugal": 94, "Saudi Pro League": 307, "MLS": 253,
            "Liga Profissional Arg": 128, "Eredivisie": 88
        }
        const apiLeagueId = leagueIdMap[request.leagueType] || 71

        // Cria o campeonato oficial
        await prisma.championship.create({
            data: {
                name: request.name,
                slug,
                code,
                leagueType: request.leagueType,
                status: 'ACTIVE',
                adminPhone: request.whatsapp, // Pega o ZAP do usuário
                ownerId: request.userId,
                apiLeagueId: apiLeagueId,
                format: 'POINTS', // Padrão, depois ele muda se quiser
                maxParticipants: 20
            }
        })

        // Atualiza status da solicitação
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

// 3. REJEITAR SOLICITAÇÃO
export async function rejectRequestAction(requestId: string) {
    await prisma.championshipRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
    })
    revalidatePath("/admin")
    return { success: true, message: "Solicitação rejeitada." }
}

// 4. MUDAR CARGO (Dar Admin)
export async function toggleUserRoleAction(targetUserId: string, currentRole: 'USER' | 'ADMIN') {
    const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER'

    await prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole }
    })

    revalidatePath("/admin")
    return { success: true, message: `Usuário agora é ${newRole}` }
}