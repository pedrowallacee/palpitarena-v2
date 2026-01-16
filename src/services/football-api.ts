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

// --- MAPA DE EXPANSÃO DE LIGAS ---
// Se o usuário escolher a liga da esquerda (Chave), o sistema busca TODAS as da direita (Valor).
const EXPANDED_LEAGUES: Record<number, number[]> = {
    // 🇧🇷 BRASIL (Série A + B + C + D)
    71: [71, 72, 75, 76],

    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 INGLATERRA (Premier + Championship + League One + League Two)
    39: [39, 40, 41, 42],

    // 🇪🇸 ESPANHA (La Liga + La Liga 2)
    140: [140, 141],

    // 🇩🇪 ALEMANHA (Bundesliga + 2. Bundesliga)
    78: [78, 79],

    // 🇮🇹 ITÁLIA (Serie A + Serie B)
    135: [135, 136],

    // 🇫🇷 FRANÇA (Ligue 1 + Ligue 2)
    61: [61, 62],

    // 🇵🇹 PORTUGAL (Liga Portugal + Liga Portugal 2)
    94: [94, 95],

    // 🇳🇱 HOLANDA (Eredivisie + Eerste Divisie)
    88: [88, 89]
};

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
// 🕵️‍♂️ AUXILIAR: BUSCAR TIMES DE UMA ÚNICA LIGA
// =====================================================================
async function fetchTeamsFromSingleLeague(leagueId: number): Promise<APITeam[]> {
    // 1. Descobrir temporada atual (com fallback para ano atual)
    let currentSeason = new Date().getFullYear();
    const seasonRes = await fetchAPI(`/leagues?id=${leagueId}&current=true`, 86400);
    if (seasonRes && seasonRes.length > 0 && seasonRes[0].seasons && seasonRes[0].seasons.length > 0) {
        currentSeason = seasonRes[0].seasons[0].year;
    }

    console.log(`🔎 [API] Buscando times da Liga ${leagueId} (Season ${currentSeason})...`);

    // 2. Tentar via TABELA (Prioridade: Times Ativos)
    try {
        const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${currentSeason}`, 3600);
        if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
            let teams: APITeam[] = [];
            standingsRes[0].league.standings.forEach((groupOrTable: any[]) => {
                groupOrTable.forEach((pos: any) => {
                    teams.push({ id: pos.team.id, name: pos.team.name, logo: pos.team.logo });
                });
            });
            if (teams.length >= 2) return teams;
        }
    } catch (e) { /* silent fail */ }

    // 3. Fallback: Lista de Inscritos
    const teamsRes = await fetchAPI(`/teams?league=${leagueId}&season=${currentSeason}`, 86400);
    if (teamsRes && teamsRes.length > 0) {
        return teamsRes.map((item: any) => ({
            id: item.team.id,
            name: item.team.name,
            logo: item.team.logo
        }));
    }

    return [];
}

// =====================================================================
// 🚀 PRINCIPAL: BUSCAR TIMES (AGORA COM SUPER PACOTE)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // Verifica se essa liga tem um "Pacote Expandido" (Ex: Brasil A -> A, B, C, D)
    // Se não tiver, usa apenas ela mesma.
    const leaguesToFetch = EXPANDED_LEAGUES[leagueId] || [leagueId];

    console.log(`⚡ [SUPER BUSCA] Liga ${leagueId} selecionada. Buscando em: [${leaguesToFetch.join(', ')}]`);

    // Busca todas as ligas em paralelo
    const promises = leaguesToFetch.map(id => fetchTeamsFromSingleLeague(id));
    const results = await Promise.all(promises);

    // Junta tudo num array só
    let allTeams: APITeam[] = results.flat();

    // REMOVE DUPLICATAS (Caso um time apareça em mais de uma lista por erro da API)
    const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.id, team])).values());

    // Ordena alfabeticamente para facilitar a busca do usuário
    uniqueTeams.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ [SUPER BUSCA] Total de times encontrados: ${uniqueTeams.length}`);
    return uniqueTeams;
}

// --- OUTRAS FUNÇÕES (MANTIDAS IGUAIS) ---

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