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
// Adicionei mais IDs para garantir cobertura total
const EXPANDED_LEAGUES: Record<number, number[]> = {
    // 🇧🇷 BRASIL (Série A + B) - Removi C e D para evitar travar a API se tiver chave free
    71: [71, 72],
    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 INGLATERRA (Premier + Championship)
    39: [39, 40],
    // 🇪🇸 ESPANHA (La Liga + La Liga 2)
    140: [140, 141],
    // 🇩🇪 ALEMANHA (Bundesliga + 2. Bundesliga)
    78: [78, 79],
    // 🇮🇹 ITÁLIA (Serie A + Serie B)
    135: [135, 136],
    // 🇫🇷 FRANÇA (Ligue 1 + Ligue 2)
    61: [61, 62],
    // 🇵🇹 PORTUGAL (Liga Portugal + Liga 2)
    94: [94, 95],
    // 🇳🇱 HOLANDA (Eredivisie)
    88: [88]
};

// Pequena pausa para não estourar a API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

            // Se der erro de API (limite excedido), loga e tenta a próxima chave
            if (data.errors && Object.keys(data.errors).length > 0) {
                console.warn(`⚠️ [API LIMIT] Chave ${index + 1} bloqueada:`, JSON.stringify(data.errors));
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

    // ORDEM DE TENTATIVA:
    // 1. 2025 (Maioria das ligas ativas ou Brasil ano passado)
    // 2. 2026 (Brasil ano atual - pode estar vazio em jan/fev)
    // 3. 2024 (Fallback seguro)
    const seasonsToTry = [2025, 2026, 2024];

    for (const season of seasonsToTry) {

        // TENTATIVA A: TABELA (Standings)
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
                    console.log(`✅ [SUCESSO] Liga ${leagueId} achada na Tabela ${season} (${teams.length} times).`);
                    return teams;
                }
            }
        } catch (e) { /* ignore */ }

        // TENTATIVA B: LISTA GERAL (Teams)
        // Só tenta isso se a tabela falhou
        try {
            const teamsRes = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
            if (teamsRes && teamsRes.length > 4) {
                console.log(`✅ [SUCESSO] Liga ${leagueId} achada na Lista ${season} (${teamsRes.length} times).`);
                return teamsRes.map((item: any) => ({
                    id: item.team.id,
                    name: item.team.name,
                    logo: item.team.logo
                }));
            }
        } catch (e) { /* ignore */ }
    }

    console.warn(`⚠️ [AVISO] Liga ${leagueId} vazia em 2025, 2026 e 2024.`);
    return [];
}

// =====================================================================
// 🚀 PRINCIPAL: SUPER BUSCA SEQUENCIAL (Para não travar a API)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // 1. Identifica quais ligas buscar
    const leaguesToFetch = EXPANDED_LEAGUES[leagueId] || [leagueId];
    console.log(`⚡ [BUSCA] Iniciando para ligas: [${leaguesToFetch.join(', ')}]`);

    let allTeams: APITeam[] = [];

    // 2. BUSCA SEQUENCIAL (Um por um, com pausa)
    // Isso evita o erro 429 (Too Many Requests)
    for (const id of leaguesToFetch) {
        const teams = await fetchTeamsFromSingleLeague(id);
        allTeams = [...allTeams, ...teams];

        // Pequena pausa de 200ms entre requisições para respirar
        await delay(200);
    }

    // 3. Remove Duplicatas
    const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.id, team])).values());

    // 4. Ordena Alfabeticamente
    uniqueTeams.sort((a, b) => a.name.localeCompare(b.name));

    if (uniqueTeams.length === 0) {
        console.error("❌ [ERRO CRÍTICO] Nenhum time encontrado após varredura completa.");
    } else {
        console.log(`✅ [FINAL] Total de times carregados: ${uniqueTeams.length}`);
    }

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