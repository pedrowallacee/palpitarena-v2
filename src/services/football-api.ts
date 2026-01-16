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
            // console.log(`📡 [API] Tentando credencial #${index + 1} para: ${endpoint}`);

            const res = await fetch(`${cred.baseUrl}${endpoint}`, {
                method: "GET",
                headers: {
                    [cred.authHeader]: cred.key,
                    "x-rapidapi-host": cred.host
                },
                next: { revalidate: cacheDuration }
            });

            const data = await res.json();

            // Se der erro de limite (429/Too Many Requests), tenta a próxima chave
            if (data.errors && Object.keys(data.errors).length > 0) {
                console.warn(`⚠️ [API LIMIT] Chave #${index + 1} bloqueada.`);
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
// 🚜 BUSCA DE TIMES POR LIGA (ROBUSTA & BLINDADA)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // ESTRATÉGIA CASCATA DE TEMPORADAS:
    // 1. 2025: Maioria das ligas europeias (25/26) e Brasileirão passado (garantido).
    // 2. 2026: Brasileirão atual (pode estar vazio em jan/fev).
    // 3. 2024: Fallback de segurança máxima.
    const seasonsToTry = [2025, 2026, 2024];

    console.log(`🔎 [API] Iniciando busca para Liga ${leagueId}...`);

    for (const season of seasonsToTry) {

        // TENTATIVA A: TABELA (Standings) -> Prioridade máxima (filtra times ativos)
        try {
            const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${season}`, 3600);

            if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
                let teams: APITeam[] = [];
                standingsRes[0].league.standings.forEach((groupOrTable: any[]) => {
                    groupOrTable.forEach((pos: any) => {
                        teams.push({ id: pos.team.id, name: pos.team.name, logo: pos.team.logo });
                    });
                });

                if (teams.length >= 4) {
                    // Remove duplicatas e retorna
                    const unique = Array.from(new Map(teams.map(t => [t.id, t])).values());
                    unique.sort((a, b) => a.name.localeCompare(b.name));
                    console.log(`✅ [SUCESSO] Liga ${leagueId} encontrada na Tabela ${season} (${unique.length} times).`);
                    return unique;
                }
            }
        } catch (e) { /* silent fail */ }

        // TENTATIVA B: LISTA GERAL (Teams) -> Plano B se não tiver tabela
        try {
            const teamsRes = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
            if (teamsRes && teamsRes.length > 4) {
                const formatted = teamsRes.map((item: any) => ({
                    id: item.team.id,
                    name: item.team.name,
                    logo: item.team.logo
                }));
                // Remove duplicatas
                const unique = Array.from(new Map(formatted.map((t: any) => [t.id, t])).values()) as APITeam[];
                unique.sort((a, b) => a.name.localeCompare(b.name));

                console.log(`✅ [SUCESSO] Liga ${leagueId} encontrada na Lista ${season} (${unique.length} times).`);
                return unique;
            }
        } catch (e) { /* silent fail */ }
    }

    console.warn(`⚠️ [AVISO] Nenhum time encontrado para a Liga ${leagueId} em 2025/26/24.`);
    return [];
}

// =====================================================================
// 🔍 NOVA FUNÇÃO: BUSCAR TIME POR NOME (GLOBAL)
// =====================================================================
export async function searchTeamByName(query: string): Promise<APITeam[]> {
    if (!query || query.length < 3) return [];

    console.log(`🔎 [API] Buscando time por nome: "${query}"...`);

    try {
        // A API exige pelo menos 3 caracteres para busca
        const response = await fetchAPI(`/teams?search=${query}`, 86400); // Cache longo (os times não mudam de nome/logo todo dia)

        if (response && response.length > 0) {
            console.log(`✅ [BUSCA] Encontrados ${response.length} times para "${query}".`);
            return response.map((item: any) => ({
                id: item.team.id,
                name: item.team.name,
                logo: item.team.logo
            }));
        }
    } catch (error) {
        console.error("Erro na busca por nome:", error);
    }

    return [];
}

// --- OUTRAS FUNÇÕES DE JOGOS (MANTIDAS IGUAIS) ---

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