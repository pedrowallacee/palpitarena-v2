'use server'

// CORREÇÃO: O nome correto do arquivo é football-api
import { getMatchesByDate } from "@/services/football-api"

export async function fetchAvailableMatches(date: string) {
    try {
        const matches = await getMatchesByDate(date)
        return matches
    } catch (error) {
        console.error("Erro ao buscar jogos:", error)
        return []
    }
}