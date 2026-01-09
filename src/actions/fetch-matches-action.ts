'use server'

import { getMatchesByDate } from "@/services/football-api"

export async function fetchAvailableMatches(date: string) {
    try {
        const matches = await getMatchesByDate(date)
        return { success: true, matches: matches }

    } catch (error) {
        console.error("Erro ao buscar jogos:", error)
        return { success: false, matches: [] }
    }
}