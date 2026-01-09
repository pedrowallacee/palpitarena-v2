// src/services/football-api.ts

// Configuração das Credenciais (Rotação)
const CREDENTIALS = [
    {
        key: process.env.FOOTBALL_KEY_1,
        baseUrl: "https://v3.football.api-sports.io",
        host: "v3.football.api-sports.io",
        authHeader: "x-apisports-key"
    },
    {
        key: process.env.FOOTBALL_KEY_2,
        baseUrl: "https://v3.football.api-sports.io",
        host: "v3.football.api-sports.io",
        authHeader: "x-apisports-key"
    },
    {
        key: process.env.FOOTBALL_KEY_3,
        baseUrl: "https://api-football-v1.p.rapidapi.com/v3",
        host: "api-football-v1.p.rapidapi.com",
        authHeader: "x-rapidapi-key"
    }
];

const CURRENT_SEASON = 2025;

// Lista de IDs de Ligas Suportadas
const SUPPORTED_LEAGUE_IDS = [
    71, 72, // Brasileirão A e B
    13, // Libertadores
    39, 40, // Premier League e Championship
    140, // La Liga
    135, // Serie A
    78, // Bundesliga
    61, // Ligue 1
    94, // Primeira Liga
    88, // Eredivisie
    144, // Jupiler Pro
    253, // MLS
    307, // Saudi Pro League
    2, // Champions League
];

export type APITeam = {
    id: number
    name: string
    logo: string
}

export type APILeague = {
    id: number
    name: string
    logo: string
    country: string
}

/**
 * Função Inteligente de Fetch com Rotação de Chaves (Failover)
 * Tenta a primeira chave, se falhar, tenta a próxima.
 */
async function fetchAPI(endpoint: string, cacheDuration = 3600) {
    let lastError = null;

    // Loop pelas credenciais disponíveis
    for (const [index, cred] of CREDENTIALS.entries()) {
        if (!cred.key) continue; // Pula se não tiver chave configurada

        try {
            console.log(`📡 Tentando API com credencial #${index + 1}...`);

            const res = await fetch(`${cred.baseUrl}${endpoint}`, {
                method: "GET",
                headers: {
                    [cred.authHeader]: cred.key,
                    "x-rapidapi-host": cred.host
                },
                next: { revalidate: cacheDuration }
            });

            // Se a resposta for OK, processamos
            if (res.ok) {
                const data = await res.json();

                // Verifica se a API retornou erros lógicos (ex: limite diário atingido)
                if (data.errors && Object.keys(data.errors).length > 0) {
                    console.warn(`⚠️ Credencial #${index + 1} retornou erro da API:`, data.errors);
                    // Não damos throw aqui, deixamos o loop continuar para a próxima chave
                    lastError = data.errors;
                    continue;
                }

                // SUCESSO! Retorna os dados e para o loop
                return data.response;
            } else {
                console.warn(`⚠️ Credencial #${index + 1} falhou com status: ${res.status}`);
            }

        } catch (error) {
            console.error(`❌ Erro de conexão com credencial #${index + 1}:`, error);
            lastError = error;
        }
    }

    // Se chegou aqui, todas as chaves falharam
    console.error("🔥 TODAS as chaves de API falharam.", lastError);
    return null;
}

// --- MÉTODOS PÚBLICOS (Mantivemos a mesma assinatura) ---

export async function getLeagues(): Promise<APILeague[]> {
    // Mantemos estático para economizar requisições
    return [
        { id: 71, name: "Brasileirão Série A", country: "Brasil", logo: "https://media.api-sports.io/football/leagues/71.png" },
        { id: 72, name: "Brasileirão Série B", country: "Brasil", logo: "https://media.api-sports.io/football/leagues/72.png" },
        { id: 13, name: "Copa Libertadores", country: "Mundo", logo: "https://media.api-sports.io/football/leagues/13.png" },
        { id: 39, name: "Premier League", country: "Inglaterra", logo: "https://media.api-sports.io/football/leagues/39.png" },
        { id: 40, name: "Championship", country: "Inglaterra", logo: "https://media.api-sports.io/football/leagues/40.png" },
        { id: 140, name: "La Liga", country: "Espanha", logo: "https://media.api-sports.io/football/leagues/140.png" },
        { id: 135, name: "Serie A", country: "Itália", logo: "https://media.api-sports.io/football/leagues/135.png" },
        { id: 78, name: "Bundesliga", country: "Alemanha", logo: "https://media.api-sports.io/football/leagues/78.png" },
        { id: 61, name: "Ligue 1", country: "França", logo: "https://media.api-sports.io/football/leagues/61.png" },
        { id: 94, name: "Primeira Liga", country: "Portugal", logo: "https://media.api-sports.io/football/leagues/94.png" },
        { id: 88, name: "Eredivisie", country: "Holanda", logo: "https://media.api-sports.io/football/leagues/88.png" },
        { id: 144, name: "Jupiler Pro League", country: "Bélgica", logo: "https://media.api-sports.io/football/leagues/144.png" },
        { id: 253, name: "Major League Soccer", country: "EUA", logo: "https://media.api-sports.io/football/leagues/253.png" },
        { id: 307, name: "Saudi Pro League", country: "Arábia Saudita", logo: "https://media.api-sports.io/football/leagues/307.png" },
        { id: 2, name: "Champions League", country: "Europa", logo: "https://media.api-sports.io/football/leagues/2.png" },
    ];
}

export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {
    const response = await fetchAPI(`/teams?league=${leagueId}&season=${CURRENT_SEASON}`, 86400); // Cache 24h

    if (!response) return [];

    return response.map((item: any) => ({
        id: item.team.id,
        name: item.team.name,
        logo: item.team.logo
    }));
}

export async function getMatchesByDate(date: string): Promise<any[]> {
    const response = await fetchAPI(`/fixtures?date=${date}&timezone=America/Sao_Paulo`, 300); // Cache 5 min

    if (!response) return [];

    const filteredMatches = response.filter((item: any) =>
        SUPPORTED_LEAGUE_IDS.includes(item.league.id)
    );

    return filteredMatches.map((item: any) => ({
        apiId: item.fixture.id,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeTeamLogo: item.teams.home.logo,
        awayTeamLogo: item.teams.away.logo,
        date: item.fixture.date,
        time: new Date(item.fixture.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
        leagueName: item.league.name,
        leagueLogo: item.league.logo
    }));
}