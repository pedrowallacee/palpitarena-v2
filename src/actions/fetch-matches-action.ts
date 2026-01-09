'use server'

import { getMatchesByDate } from "@/services/football-api"

export async function fetchAvailableMatches(date: string) {
    try {
        // CORREÇÃO: Chamando a função com o nome novo
        const matches = await getMatchesByDate(date)
        return matches
    } catch (error) {
        console.error("Erro ao buscar jogos:", error)
        return []
    }
}