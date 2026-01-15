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

// --- FUNÇÕES DE TIMES ---
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {
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

// --- FUNÇÃO DE BUSCA POR DATA (COM CACHE CONTROLADO) ---
export async function getMatchesByDate(date: string, cacheTime = 300): Promise<any[]> {
    const response = await fetchAPI(`/fixtures?date=${date}&timezone=America/Sao_Paulo`, cacheTime);

    if (!response) return [];

    return response.map((item: any) => ({
        apiId: item.fixture.id,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        date: item.fixture.date,
        leagueName: item.league.name,
        leagueLogo: item.league.logo,
        status: item.fixture.status.short,
        homeScore: item.goals.home,
        awayScore: item.goals.away
    }));
}

// --- FUNÇÃO DE JOGOS AO VIVO ---
export async function getLiveMatches(): Promise<any[]> {
    const response = await fetchAPI(`/fixtures?live=all`, 0); // Live é sempre 0 cache
    if (!response) return [];

    return response.map((item: any) => ({
        apiId: item.fixture.id.toString(),
        status: item.fixture.status.short,
        homeScore: item.goals.home,
        awayScore: item.goals.away,
        elapsed: item.fixture.status.elapsed
    }));
}

// --- NOVA FUNÇÃO: BUSCA EM LOTE (CORREÇÃO DO PROBLEMA) ---
export async function getMatchesByIds(ids: number[]): Promise<any[]> {
    if (ids.length === 0) return [];

    // A API aceita no máximo 20 IDs por vez separados por traço
    // Vamos dividir em lotes de 20 para garantir que não falhe
    const batches = [];
    for (let i = 0; i < ids.length; i += 20) {
        batches.push(ids.slice(i, i + 20));
    }

    let allMatches: any[] = [];

    for (const batch of batches) {
        const idsString = batch.join('-');
        console.log(`⚡ [API] Buscando lote de jogos: ${idsString}`);

        // Cache de 1 hora (3600) para garantir dados estáveis ao adicionar
        const response = await fetchAPI(`/fixtures?ids=${idsString}`, 3600);

        if (response) {
            const formatted = response.map((item: any) => ({
                apiId: item.fixture.id,
                homeTeam: item.teams.home.name,
                awayTeam: item.teams.away.name,
                homeLogo: item.teams.home.logo,
                awayLogo: item.teams.away.logo,
                date: item.fixture.date,
                leagueName: item.league.name,
                leagueLogo: item.league.logo,
                status: item.fixture.status.short,
                homeScore: item.goals.home,
                awayScore: item.goals.away
            }));
            allMatches = [...allMatches, ...formatted];
        }
    }

    return allMatches;
}