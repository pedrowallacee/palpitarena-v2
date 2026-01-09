'use server'
import { getMatchesFromApi } from "@/services/api-football"

export async function fetchAvailableMatches(date: string) {
    try {
        const matches = await getMatchesFromApi(date)
        return { success: true, matches }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao buscar jogos" }
    }
}