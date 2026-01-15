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
                // console.warn(`⚠️ [API ERR] Credencial #${index + 1}:`, JSON.stringify(data.errors));
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

// =====================================================================
// 🕵️‍♂️ 1. DESCOBRIR TEMPORADA ATUAL
// =====================================================================
async function getCurrentSeasonYear(leagueId: number): Promise<number> {
    const response = await fetchAPI(`/leagues?id=${leagueId}&current=true`, 86400);

    if (response && response.length > 0 && response[0].seasons && response[0].seasons.length > 0) {
        return response[0].seasons[0].year;
    }

    // Fallback: Se falhar, usa o ano que a gente sabe que a maioria das ligas europeias estão (2025 em jan/26)
    return 2025;
}

// =====================================================================
// 📋 2. BUSCA VIA TABELA (Retorna null se falhar)
// =====================================================================
async function fetchFromStandings(leagueId: number, season: number): Promise<APITeam[] | null> {
    try {
        const res = await fetchAPI(`/standings?league=${leagueId}&season=${season}`, 3600);

        if (res && res.length > 0 && res[0].league && res[0].league.standings) {
            let teams: APITeam[] = [];
            res[0].league.standings.forEach((groupOrTable: any[]) => {
                groupOrTable.forEach((pos: any) => {
                    teams.push({ id: pos.team.id, name: pos.team.name, logo: pos.team.logo });
                });
            });
            // Remove duplicatas e retorna se tiver times suficientes
            if (teams.length >= 4) {
                const unique = Array.from(new Map(teams.map(t => [t.id, t])).values());
                return unique;
            }
        }
    } catch (e) { return null; }
    return null;
}

// =====================================================================
// 📦 3. BUSCA VIA LISTA DE TIMES (Retorna null se falhar)
// =====================================================================
async function fetchFromTeamsList(leagueId: number, season: number): Promise<APITeam[] | null> {
    try {
        const res = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
        if (res && res.length > 4) {
            return res.map((item: any) => ({
                id: item.team.id,
                name: item.team.name,
                logo: item.team.logo
            }));
        }
    } catch (e) { return null; }
    return null;
}

// =====================================================================
// 🚀 FUNÇÃO PRINCIPAL (CASCATA BLINDADA)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // 1. Pega a temporada "OFICIAL"
    const currentSeason = await getCurrentSeasonYear(leagueId);

    // 2. Define a ordem de tentativas: [Ano Atual, Ano Anterior]
    // Se a API diz que estamos em 2026, mas não tem dados, tentamos 2025.
    const seasonsToTry = [currentSeason, currentSeason - 1];

    console.log(`🔎 Buscando times para Liga ${leagueId}. Tentativas: ${seasonsToTry.join(', ')}`);

    for (const season of seasonsToTry) {
        // A. Tenta Tabela (Melhor qualidade, sem eliminados)
        const teamsStandings = await fetchFromStandings(leagueId, season);
        if (teamsStandings) {
            console.log(`✅ [Standings] Sucesso na temporada ${season} (${teamsStandings.length} times)`);
            return teamsStandings;
        }

        // B. Tenta Lista Bruta (Fallback se não tiver tabela)
        const teamsList = await fetchFromTeamsList(leagueId, season);
        if (teamsList) {
            console.log(`✅ [TeamsList] Sucesso na temporada ${season} (${teamsList.length} times)`);
            return teamsList;
        }
    }

    console.error(`❌ FALHA TOTAL: Nenhum time encontrado para Liga ${leagueId} em nenhuma temporada recente.`);
    return [];
}

// --- RESTO DAS FUNÇÕES IGUAIS ---

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

export async function getMatchesByIds(ids: number[]): Promise<any[]> {
    if (ids.length === 0) return [];
    const batches = [];
    for (let i = 0; i < ids.length; i += 20) batches.push(ids.slice(i, i + 20));

    let allMatches: any[] = [];
    for (const batch of batches) {
        const idsString = batch.join('-');
        console.log(`⚡ [API] Buscando lote de jogos: ${idsString}`);
        const response = await fetchAPI(`/fixtures?ids=${idsString}&timezone=America/Sao_Paulo`, 3600);
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