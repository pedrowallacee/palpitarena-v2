// Regras do Jogo
// 1. CRAVADA (Placar Exato): 10 Pontos
// 2. VENCEDOR + SALDO (Ex: Palpite 2-0, Real 3-1): 7 Pontos
// 3. VENCEDOR SIMPLES (Ex: Palpite 1-0, Real 2-1): 5 Pontos
// 4. EMPATE GARANTIDO (Ex: Palpite 1-1, Real 2-2): 5 Pontos
// 5. GOL DE UM TIME (Acertou gols de um lado): +1 Ponto Extra (Opcional)

export function calculatePoints(predHome: number, predAway: number, realHome: number, realAway: number) {
    let points = 0
    let exactScore = false

    // 1. CRAVADA (Exato)
    if (predHome === realHome && predAway === realAway) {
        points = 10
        exactScore = true
        return { points, exactScore } // Retorna logo pois é a pontuação máxima
    }

    // Identificar Vencedor Real e Palpitado
    const realWinner = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'DRAW'
    const predWinner = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW'

    // 2. ACERTOU O RESULTADO (Vencedor ou Empate)
    if (realWinner === predWinner) {
        points = 5 // Base por acertar quem ganhou

        // Bônus: Acertou o Saldo de Gols? (Ex: Palpite 2-0 (saldo 2) e Jogo 3-1 (saldo 2))
        const realDiff = realHome - realAway
        const predDiff = predHome - predAway

        if (realDiff === predDiff) {
            points += 2 // Total 7
        }
    }

    // Bônus Extra: Acertou gols de um dos times exatamente? (Consolação)
    // Ex: Palpite 2-1 (Errou vencedor), Jogo 0-1. Acertou que o visitante fez 1 gol.
    // Pode adicionar +1 ponto aqui se quiser, mas vou deixar comentado para não inflacionar.
    // if (predHome === realHome || predAway === realAway) points += 1

    return { points, exactScore }
}