// src/services/football-api.ts

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

export type APITeam = {
    id: number
    name: string
    logo: string
}

async function fetchAPI(endpoint: string, cacheDuration = 3600) {
    for (const [index, cred] of CREDENTIALS.entries()) {
        if (!cred.key) continue;

        try {
            // console.log(`🔌 [API] Tentando Credencial #${index + 1}...`);
            const res = await fetch(`${cred.baseUrl}${endpoint}`, {
                method: "GET",
                headers: {
                    [cred.authHeader]: cred.key,
                    "x-rapidapi-host": cred.host
                },
                next: { revalidate: cacheDuration }
            });

            const data = await res.json();

            if (data.errors && Object.keys(data.errors).length > 0) {
                console.warn(`⚠️ [API ERR] Credencial #${index + 1}:`, JSON.stringify(data.errors));
                continue;
            }
            if (!data.response) continue;

            return data.response;

        } catch (error) {
            console.error(`🔥 [API CRASH] Erro na credencial #${index + 1}:`, error);
        }
    }
    return null;
}

// --- FUNÇÕES DE TIMES (Mantenha igual) ---
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {
    // Tenta 2025, se não der tenta 2024
    const seasons = [2025, 2024];
    for (const season of seasons) {
        const response = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
        if (response && response.length > 0) {
            return response.map((item: any) => ({
                id: item.team.id,
                name: item.team.name,
                logo: item.team.logo
            }));
        }
    }
    return [];
}

// --- AQUI ESTAVA O PROBLEMA: REMOVIDO O FILTRO DE LIGAS ---
export async function getMatchesByDate(date: string): Promise<any[]> {
    // Pede TUDO da data
    const response = await fetchAPI(`/fixtures?date=${date}&timezone=America/Sao_Paulo`, 300);

    if (!response) return [];

    // NÃO FILTRAMOS MAIS NADA!
    // Se a API mandou, a gente entrega pro sistema.
    // A filtragem real acontece depois, comparando com os IDs que você já salvou no banco.

    return response.map((item: any) => ({
        apiId: item.fixture.id, // Mantém como number ou string, tratamos depois
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        date: item.fixture.date,
        leagueName: item.league.name,
        leagueLogo: item.league.logo,
        status: item.fixture.status.short, // FT, LIVE, etc
        homeScore: item.goals.home,
        awayScore: item.goals.away
    }));
}

export async function getLiveMatches(): Promise<any[]> {
    const response = await fetchAPI(`/fixtures?live=all`, 0);
    if (!response) return [];

    return response.map((item: any) => ({
        apiId: item.fixture.id.toString(),
        status: item.fixture.status.short,
        homeScore: item.goals.home,
        awayScore: item.goals.away,
        elapsed: item.fixture.status.elapsed
    }));
}