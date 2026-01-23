// src/lib/ranking-rules.ts

export const COMPETITION_CATEGORIES = {
    NATIONAL: { label: "Ligas Nacionais", points: [800, 400, 200], icon: "Flag" },
    CONTINENTAL: { label: "Copas / Continentais", points: [1200, 700, 350], icon: "Trophy" },
    WORLD_CLUB: { label: "Mundial de Clubes", points: [2500, 900, 450], icon: "Globe" },
    WORLD_CUP: { label: "Copa do Mundo", points: [5000, 1500, 750], icon: "Globe2" },
} as const;

// Lista de Competições para o Admin preencher (Fácil de adicionar mais)
export const COMPETITION_LIST = [
    { name: "Brasileirão Série A", category: "NATIONAL", flag: "🇧🇷" },
    { name: "Brasileirão Série B", category: "NATIONAL", flag: "🇧🇷" },
    { name: "Premier League", category: "NATIONAL", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Serie A TIM", category: "NATIONAL", flag: "🇮🇹" },
    { name: "La Liga", category: "NATIONAL", flag: "🇪🇸" },
    { name: "Bundesliga", category: "NATIONAL", flag: "🇩🇪" },
    { name: "Ligue 1", category: "NATIONAL", flag: "🇫🇷" },
    { name: "Liga Portugal", category: "NATIONAL", flag: "🇵🇹" },
    { name: "Eredivisie", category: "NATIONAL", flag: "🇳🇱" },
    { name: "Liga Profissional", category: "NATIONAL", flag: "🇦🇷" },
    { name: "MLS", category: "NATIONAL", flag: "🇺🇸" },
    { name: "Liga Saudita", category: "NATIONAL", flag: "🇸🇦" },
    { name: "Champions League", category: "CONTINENTAL", flag: "🌐" },
    { name: "Europa League", category: "CONTINENTAL", flag: "🌐" },
    { name: "Libertadores", category: "CONTINENTAL", flag: "🔱" },
    { name: "Copa do Brasil", category: "CONTINENTAL", flag: "🔰" },
    { name: "Mundial de Clubes", category: "WORLD_CLUB", flag: "🌍" },
    { name: "Copa do Mundo", category: "WORLD_CUP", flag: "🌍" },
];