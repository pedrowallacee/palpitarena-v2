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

// =====================================================================
// 🕵️‍♂️ FUNÇÃO DE TIMES - MODO "100% FIEL" (STANDINGS ONLY)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {
    // Ordem de prioridade: Temporada 2025 (Atual), depois 2024 (Caso a API esteja atrasada)
    const seasons = [2025, 2024];

    for (const season of seasons) {
        console.log(`🔎 [API] Buscando TABELA da Liga ${leagueId} na temporada ${season}...`)

        try {
            // Buscamos EXCLUSIVAMENTE a tabela (/standings).
            // Isso garante que pegamos apenas os times ativos na fase de liga/grupos.
            const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${season}`, 3600);

            if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
                const standings = standingsRes[0].league.standings;
                let teams: APITeam[] = [];

                // O endpoint standings retorna um array de grupos.
                // Iteramos por todos os grupos/tabelas para extrair os times.
                standings.forEach((groupOrTable: any[]) => {
                    groupOrTable.forEach((position: any) => {
                        teams.push({
                            id: position.team.id,
                            name: position.team.name,
                            logo: position.team.logo
                        });
                    });
                });

                // Se encontrou times na tabela, ISSO É A VERDADE. Retorna e encerra.
                if (teams.length >= 2) { // Pelo menos 2 times para ser uma liga válida
                    console.log(`✅ [API] Sucesso! ${teams.length} times ativos encontrados na Tabela ${season}.`);

                    // Remove duplicatas (caso a API retorne bugs de grupos repetidos)
                    const uniqueTeams = Array.from(new Map(teams.map(t => [t.id, t])).values());
                    return uniqueTeams;
                }
            }
        } catch (err) {
            console.warn(`⚠️ Erro ao processar tabela da temporada ${season}:`, err);
        }
    }

    // Se chegou aqui, é porque não achou tabela em 2025 nem 2024.
    // Nesse caso crítico, tentamos a lista bruta APENAS da temporada 2025 para não ficar vazio.
    console.log(`⚠️ [FALLBACK] Tabela não encontrada. Tentando lista bruta de inscritos (2025)...`);
    const fallbackRes = await fetchAPI(`/teams?league=${leagueId}&season=2025`, 86400);

    if (fallbackRes && fallbackRes.length > 0) {
        return fallbackRes.map((item: any) => ({
            id: item.team.id,
            name: item.team.name,
            logo: item.team.logo
        }));
    }

    return [];
}

// --- FUNÇÃO DE BUSCA POR DATA (COM FUSO CORRIGIDO) ---
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

// --- FUNÇÃO DE BUSCA EM LOTE (COM FUSO CORRIGIDO) ---
export async function getMatchesByIds(ids: number[]): Promise<any[]> {
    if (ids.length === 0) return [];

    const batches = [];
    for (let i = 0; i < ids.length; i += 20) {
        batches.push(ids.slice(i, i + 20));
    }

    let allMatches: any[] = [];

    for (const batch of batches) {
        const idsString = batch.join('-');
        console.log(`⚡ [API] Buscando lote de jogos: ${idsString}`);

        // AQUI ESTÁ A CORREÇÃO DO HORÁRIO: &timezone=America/Sao_Paulo
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