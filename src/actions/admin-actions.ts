'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Mapa simples para converter o nome da liga no Select para o ID da API
const LEAGUE_MAP: Record<string, number> = {
    "Brasileirão": 71,
    "Brasileirão B": 72,
    "Premier League": 39,
    "La Liga": 140,
    "Serie A": 135,
    "Bundesliga": 78,
    "Ligue 1": 61,
    "Champions League": 2,
    "Libertadores": 13,
    "Saudi Pro League": 307,
    "Primeira Liga": 94,
    "Eredivisie": 88,
    "Championship": 40,
    "Jupiler Pro League": 144,
    "MLS": 253,
    "Personalizada": 0 // 0 ou null para personalizada
}

export async function handleRequestAction(formData: FormData) {
    const requestId = formData.get("requestId") as string
    const action = formData.get("action") as "APPROVE" | "REJECT"

    try {
        if (action === "REJECT") {
            await prisma.championshipRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" }
            })
            revalidatePath("/admin/solicitacoes")
            return { success: true, message: "Pedido rejeitado." }
        }

        // --- LÓGICA DE APROVAÇÃO ---

        // 1. Busca os dados do pedido
        const request = await prisma.championshipRequest.findUnique({
            where: { id: requestId }
        })

        if (!request) return { success: false, message: "Pedido não encontrado." }

        // 2. Gera um Slug (URL) único baseada no nome
        // Ex: "Copa dos Amigos" -> "copa-dos-amigos-123"
        const cleanName = request.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        const randomSuffix = Math.floor(Math.random() * 1000)
        const slug = `${cleanName}-${randomSuffix}`

        // 3. Descobre o ID da Liga da API
        const apiLeagueId = LEAGUE_MAP[request.leagueType] || null

        // 4. Cria o Campeonato Oficialmente
        await prisma.championship.create({
            data: {
                name: request.name,
                slug: slug,
                description: `Campeonato de ${request.leagueType}`,
                ownerId: request.userId,
                apiLeagueId: apiLeagueId,
                status: 'REGISTRATION'
            }
        })

        // 5. Atualiza o pedido para APROVADO
        await prisma.championshipRequest.update({
            where: { id: requestId },
            data: { status: "APPROVED" }
        })

        revalidatePath("/admin/solicitacoes")
        return { success: true, message: `Campeonato criado! Slug: ${slug}` }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro ao processar." }
    }
}