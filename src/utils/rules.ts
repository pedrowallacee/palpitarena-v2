export function getCopyLimit(totalMatches: number): number {
    if (totalMatches >= 20) return 999; // Livre
    if (totalMatches >= 18) return 9;
    if (totalMatches >= 16) return 8;
    if (totalMatches >= 14) return 7;
    if (totalMatches >= 12) return 6;
    if (totalMatches >= 10) return 5;
    if (totalMatches >= 8) return 4;
    if (totalMatches >= 6) return 3;
    return 2; // Padrão para menos de 6 jogos (segurança)
}