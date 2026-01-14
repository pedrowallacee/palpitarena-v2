// src/utils/scoring.ts

export const SCORING_RULES = {
    OUSADO: 6,       // Ex: 3x1, 4x0 (Vencedor com 3+ gols)
    EMPATE_EXATO: 4, // Ex: 1x1, 2x2
    PLACAR_EXATO: 3, // Ex: 1x0, 2x0, 2x1 (Placar simples)
    EMPATE: 2,       // Ex: Apostou 1x1, foi 0x0
    VITORIA: 1,      // Ex: Apostou 2x0, foi 1x0
    ERRO: 0
}

export function calculatePoints(
    realHome: number,
    realAway: number,
    predHome: number,
    predAway: number
): { points: number, type: string } {

    const isExact = realHome === predHome && realAway === predAway

    // Resultados (Quem ganhou ou se deu empate)
    const realResult = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'DRAW'
    const predResult = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW'

    // 1. LÓGICA DE PLACAR EXATO (CRAVADA)
    if (isExact) {
        if (realResult === 'DRAW') {
            return { points: SCORING_RULES.EMPATE_EXATO, type: 'EMPATE_EXATO' }
        }

        // Regra do Placar Ousado: Vencedor fez 3 ou mais gols?
        const winnerGoals = Math.max(realHome, realAway)
        if (winnerGoals >= 3) {
            return { points: SCORING_RULES.OUSADO, type: 'OUSADO' }
        }

        return { points: SCORING_RULES.PLACAR_EXATO, type: 'PLACAR_EXATO' }
    }

    // 2. ACERTOU O RESULTADO (MAS ERROU O PLACAR)
    if (realResult === predResult) {
        if (realResult === 'DRAW') {
            return { points: SCORING_RULES.EMPATE, type: 'EMPATE' }
        }
        return { points: SCORING_RULES.VITORIA, type: 'VITORIA' }
    }

    // 3. ERROU TUDO
    return { points: SCORING_RULES.ERRO, type: 'ERRO' }
}