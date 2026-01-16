'use server'

import { searchTeamByName } from "@/services/football-api"

export async function searchTeamAction(query: string) {
    // Validação básica para não gastar API a toa
    if (!query || query.length < 3) {
        return { success: false, message: "Digite pelo menos 3 letras.", data: [] }
    }

    try {
        const teams = await searchTeamByName(query)

        if (teams.length === 0) {
            return { success: false, message: "Nenhum time encontrado.", data: [] }
        }

        return { success: true, data: teams }
    } catch (error) {
        console.error("Erro na action de busca:", error)
        return { success: false, message: "Erro ao buscar time.", data: [] }
    }
}