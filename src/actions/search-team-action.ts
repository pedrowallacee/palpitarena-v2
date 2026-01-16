'use server'

import { prisma } from "@/lib/prisma"
import { searchTeamByName } from "@/services/football-api"

export async function searchTeamAction(query: string) {
    // 1. Validação básica
    if (!query || query.length < 3) {
        return { success: false, message: "Digite pelo menos 3 letras.", data: [] }
    }

    try {
        const normalizedQuery = query.trim()

        // ---------------------------------------------------------
        // FASE 1: BUSCA LOCAL (Rápida e Grátis)
        // ---------------------------------------------------------
        // Se der erro no "cachedTeam" aqui, é porque falta rodar: npx prisma db push
        const localTeams = await prisma.cachedTeam.findMany({
            where: {
                name: {
                    contains: normalizedQuery,
                    mode: 'insensitive' // Ignora maiúsculas/minúsculas
                }
            },
            take: 20
        })

        const formattedLocalTeams = localTeams.map(t => ({
            id: t.apiId,
            name: t.name,
            logo: t.logo
        }))

        // Se achou 5 ou mais times no banco local, retorna eles e economiza API
        if (formattedLocalTeams.length >= 5) {
            console.log(`✅ [CACHE] Encontrados ${formattedLocalTeams.length} times locais para "${query}".`)
            return { success: true, data: formattedLocalTeams }
        }

        // ---------------------------------------------------------
        // FASE 2: BUSCA EXTERNA NA API
        // ---------------------------------------------------------
        console.log(`🌍 [API] Buscando na API externa para "${query}"...`)
        const apiTeams = await searchTeamByName(normalizedQuery)

        if (apiTeams.length === 0) {
            return {
                success: formattedLocalTeams.length > 0,
                message: formattedLocalTeams.length > 0 ? undefined : "Nenhum time encontrado.",
                data: formattedLocalTeams
            }
        }

        // ---------------------------------------------------------
        // FASE 3: SALVAR NO BANCO (CACHE)
        // ---------------------------------------------------------
        await Promise.all(apiTeams.map(async (team) => {
            return prisma.cachedTeam.upsert({
                where: { apiId: team.id },
                update: {
                    name: team.name,
                    logo: team.logo,
                },
                create: {
                    apiId: team.id,
                    name: team.name,
                    logo: team.logo
                }
            }).catch((err: any) => console.error(`Erro ao salvar time ${team.name}:`, err)) // <--- CORREÇÃO DO ERR AQUI
        }))

        console.log(`💾 [DB] ${apiTeams.length} novos times salvos/atualizados no cache.`)

        // ---------------------------------------------------------
        // FASE 4: MISTURAR RESULTADOS
        // ---------------------------------------------------------
        const allTeams = [...formattedLocalTeams, ...apiTeams]
        const uniqueTeams = Array.from(new Map(allTeams.map(item => [item.id, item])).values())

        return { success: true, data: uniqueTeams }

    } catch (error) {
        console.error("Erro na action de busca:", error)
        return { success: false, message: "Erro ao buscar time.", data: [] }
    }
}