// Regras de Pontuação (Padrão Bolão Clássico)
export function calculateScore(userHome: number, userAway: number, realHome: number, realAway: number) {

    // 1. CRAVADA (Placar Exato) - 10 Pontos
    // Ex: Apostou 2x1 e foi 2x1
    if (userHome === realHome && userAway === realAway) {
        return { points: 10, type: "EXACT" }
    }

    // Descobre quem ganhou ou se foi empate
    const userWinner = userHome > userAway ? "HOME" : userHome < userAway ? "AWAY" : "DRAW"
    const realWinner = realHome > realAway ? "HOME" : realHome < realAway ? "AWAY" : "DRAW"

    // 2. ACERTOU O VENCEDOR (Mas errou o placar)
    if (userWinner === realWinner) {

        // Bônus: Acertou o Saldo de Gols? (Ex: Apostou 2x0 e foi 3x1 -> Saldo 2)
        const userDiff = userHome - userAway
        const realDiff = realHome - realAway

        if (userDiff === realDiff) {
            return { points: 5, type: "DIFF" } // Acertou Vencedor + Saldo (5 pts)
        }

        return { points: 3, type: "WINNER" } // Só acertou o Vencedor (3 pts)
    }

    // 3. ERROU TUDO
    return { points: 0, type: "MISS" }
}