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

// --- MAPA DE EXPANSÃO (SUPER BUSCA) ---
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
// 🕵️‍♂️ BUSCA INTELIGENTE POR LIGA (Com Fallback de Anos)
// =====================================================================
async function fetchTeamsFromSingleLeague(leagueId: number): Promise<APITeam[]> {

    // Lista de temporadas para tentar (na ordem de prioridade)
    // 1. Temporada 2025 (Atual Europa / Passada Brasil)
    // 2. Temporada 2026 (Futura/Atual Brasil)
    // 3. Temporada 2024 (Segurança)
    const seasonsToTry = [2025, 2026, 2024];

    // console.log(`🔎 [API] Varrendo Liga ${leagueId} nas temporadas: [${seasonsToTry.join(', ')}]`);

    for (const season of seasonsToTry) {

        // TENTATIVA A: TABELA (Standings) - Prioridade Máxima
        try {
            const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${season}`, 3600);

            if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
                let teams: APITeam[] = [];
                standingsRes[0].league.standings.forEach((groupOrTable: any[]) => {
                    groupOrTable.forEach((pos: any) => {
                        teams.push({ id: pos.team.id, name: pos.team.name, logo: pos.team.logo });
                    });
                });

                // Se achou um número bom de times (ex: >=4), retorna e para de procurar!
                if (teams.length >= 4) {
                    // console.log(`✅ [SUCESSO] Liga ${leagueId} encontrada via Tabela ${season} (${teams.length} times).`);
                    return teams;
                }
            }
        } catch (e) { /* ignore */ }

        // TENTATIVA B: LISTA GERAL (Teams) - Plano B
        try {
            const teamsRes = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
            if (teamsRes && teamsRes.length > 4) {
                // console.log(`✅ [SUCESSO] Liga ${leagueId} encontrada via Lista Geral ${season} (${teamsRes.length} times).`);
                return teamsRes.map((item: any) => ({
                    id: item.team.id,
                    name: item.team.name,
                    logo: item.team.logo
                }));
            }
        } catch (e) { /* ignore */ }
    }

    console.warn(`⚠️ [AVISO] Nenhum time encontrado para a Liga ${leagueId} após tentar todas as temporadas.`);
    return [];
}

// =====================================================================
// 🚀 PRINCIPAL: SUPER BUSCA (Expansão + Cascata)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // 1. Identifica quais ligas buscar (Ex: Se for Brasil A, busca A+B+C+D)
    const leaguesToFetch = EXPANDED_LEAGUES[leagueId] || [leagueId];

    console.log(`⚡ [SUPER BUSCA] Liga ${leagueId} -> Expandindo para: [${leaguesToFetch.join(', ')}]`);

    // 2. Busca todas em paralelo
    const promises = leaguesToFetch.map(id => fetchTeamsFromSingleLeague(id));
    const results = await Promise.all(promises);

    // 3. Junta os resultados num array único
    let allTeams: APITeam[] = results.flat();

    // 4. Remove Duplicatas (Pelo ID do time)
    const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.id, team])).values());

    // 5. Ordena Alfabeticamente
    uniqueTeams.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ [FINAL] Total de times únicos retornados: ${uniqueTeams.length}`);
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