// src/utils/championship-rules.ts

/**
 * 1. CÁLCULO DE PONTUAÇÃO (Seu sistema de pontos)
 */
export function calculatePoints(
    betHome: number,
    betAway: number,
    realHome: number,
    realAway: number
): number {
    // Verifica se o palpite é exato (na mosca)
    const isExact = betHome === realHome && betAway === realAway;

    // Verifica quem ganhou ou se deu empate (no palpite e no real)
    const betResult = betHome > betAway ? 'HOME' : betHome < betAway ? 'AWAY' : 'DRAW';
    const realResult = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'DRAW';

    // Acertou o vencedor ou empate?
    const correctTrend = betResult === realResult;

    // --- REGRAS ESPECÍFICAS DO NIKAO FC ---

    // 1. PLACAR OUSADO (6 Pontos)
    // Regra: Cravar placar com soma de gols > 5 (Ex: 4x2, 5x1, 3x3)
    const totalGoals = realHome + realAway;
    if (isExact && totalGoals > 5) {
        return 6;
    }

    // 2. EMPATE EXATO (4 Pontos)
    // Regra: Cravar o empate exato (Ex: 2x2 cravado)
    if (isExact && realResult === 'DRAW') {
        return 4;
    }

    // 3. PLACAR EXATO COMUM (3 Pontos)
    // Regra: Cravar vitória de alguém (Ex: 2x1 cravado)
    if (isExact && realResult !== 'DRAW') {
        return 3;
    }

    // 4. EMPATE NÃO EXATO (2 Pontos)
    // Regra: Acertou que ia empatar, mas errou o placar (Ex: Apostou 1x1, foi 2x2)
    if (correctTrend && realResult === 'DRAW') {
        return 2;
    }

    // 5. VITÓRIA SIMPLES (1 Ponto)
    // Regra: Acertou quem ganhou, mas errou o placar (Ex: Apostou 1x0, foi 3x0)
    if (correctTrend && realResult !== 'DRAW') {
        return 1;
    }

    // Se errou tudo
    return 0;
}

/**
 * 2. REGRA DE CÓPIA (Anti-Cheat)
 * Verifica se um jogador copiou o adversário além do limite permitido.
 */
export function checkCopyViolation(
    userBets: { matchId: string, home: number, away: number }[],
    opponentBets: { matchId: string, home: number, away: number }[],
    totalGamesInRound: number
): boolean {

    // Define o limite de cópias baseado no total de jogos da rodada
    let allowedCopies = 0;

    if (totalGamesInRound <= 6) allowedCopies = 3;
    else if (totalGamesInRound <= 8) allowedCopies = 4;
    else if (totalGamesInRound <= 10) allowedCopies = 5;
    else if (totalGamesInRound <= 12) allowedCopies = 6;
    else if (totalGamesInRound <= 14) allowedCopies = 7;
    else if (totalGamesInRound <= 16) allowedCopies = 8;
    else if (totalGamesInRound <= 18) allowedCopies = 9;
    else allowedCopies = 999; // 20+ jogos é Livre

    // Conta quantos palpites IDÊNTICOS existem
    let copyCount = 0;

    userBets.forEach(uBet => {
        const oBet = opponentBets.find(ob => ob.matchId === uBet.matchId);

        // Só conta se o adversário já tiver palpitado também
        if (oBet) {
            if (uBet.home === oBet.home && uBet.away === oBet.away) {
                copyCount++;
            }
        }
    });

    // Retorna TRUE se violou a regra (copiou demais)
    // Se copyCount > allowedCopies, o cara perde por W.O.
    return copyCount > allowedCopies;
}

/**
 * 3. REGRA DOS 10 MINUTOS (Tolerância)
 * Verifica se o palpite ainda pode ser aceito
 */
export function isBetAllowedTime(matchDate: Date, currentScoreHome: number, currentScoreAway: number): boolean {
    const now = new Date().getTime();
    const gameStart = new Date(matchDate).getTime();
    const diffInMinutes = (now - gameStart) / 1000 / 60;

    // Se o jogo ainda não começou, pode apostar
    if (diffInMinutes < 0) return true;

    // Se o jogo começou há menos de 10 minutos E ainda está 0x0
    if (diffInMinutes <= 10 && currentScoreHome === 0 && currentScoreAway === 0) {
        return true;
    }

    // Passou de 10 min ou já saiu gol
    return false;
}