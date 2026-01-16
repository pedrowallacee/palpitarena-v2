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
// 🚜 FUNÇÃO DE TIMES - MODO FORÇA BRUTA (Tenta tudo até achar)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // Lista de temporadas para testar na ordem de prioridade.
    // 2025: Temporada atual da Europa (25/26)
    // 2026: Temporada atual do Brasil/Américas (2026)
    // 2024: Temporada passada (Backup de segurança)
    const seasonsToTry = [2025, 2026, 2024];

    console.log(`🔎 [API] Iniciando varredura para a Liga ${leagueId}...`);

    for (const season of seasonsToTry) {
        // --- TENTATIVA A: TABELA (Standings) ---
        // Prioridade máxima pois filtra eliminados
        try {
            const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${season}`, 3600);

            if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
                let teams: APITeam[] = [];
                standingsRes[0].league.standings.forEach((groupOrTable: any[]) => {
                    groupOrTable.forEach((pos: any) => {
                        teams.push({ id: pos.team.id, name: pos.team.name, logo: pos.team.logo });
                    });
                });

                // Se achou pelo menos 4 times, confia e retorna!
                if (teams.length >= 4) {
                    const unique = Array.from(new Map(teams.map(t => [t.id, t])).values());
                    console.log(`✅ [SUCESSO] Encontrados ${unique.length} times na Tabela de ${season}.`);
                    return unique;
                }
            }
        } catch (e) { /* Ignora erro e tenta o próximo */ }

        // --- TENTATIVA B: LISTA GERAL (Teams) ---
        // Se a tabela falhou, pega a lista geral dessa temporada
        try {
            const teamsRes = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
            if (teamsRes && teamsRes.length > 4) {
                console.log(`✅ [SUCESSO] Encontrados ${teamsRes.length} times na Lista Geral de ${season}.`);
                return teamsRes.map((item: any) => ({
                    id: item.team.id,
                    name: item.team.name,
                    logo: item.team.logo
                }));
            }
        } catch (e) { /* Ignora erro e tenta o próximo */ }
    }

    console.error(`❌ [FALHA] Não foi possível encontrar times para a liga ${leagueId} em 2025, 2026 ou 2024.`);
    return [];
}

// --- OUTRAS FUNÇÕES (Mantidas originais) ---

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