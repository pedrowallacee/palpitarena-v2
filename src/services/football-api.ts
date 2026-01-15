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

// --- FUNÇÃO DE TIMES (ATUALIZADA PARA FILTRAR ELIMINADOS) ---
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {
    const seasons = [2025, 2024];
    for (const season of seasons) {

        // 1. ESTRATÉGIA INTELIGENTE: Buscar via Tabela (Standings)
        // Isso filtra automaticamente os times eliminados na pré-qualificação,
        // pois eles não aparecem na tabela oficial da Fase de Liga/Grupos.
        try {
            console.log(`🔎 [API] Tentando buscar times via Tabela da liga ${leagueId}/${season}...`)
            const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${season}`, 3600);

            if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
                const standings = standingsRes[0].league.standings;
                let teams: APITeam[] = [];

                // A API pode retornar arrays aninhados (ex: grupos A, B, C ou Tabela Única)
                // Esse loop varre tudo e extrai os times
                standings.forEach((groupOrTable: any[]) => {
                    groupOrTable.forEach((position: any) => {
                        teams.push({
                            id: position.team.id,
                            name: position.team.name,
                            logo: position.team.logo
                        });
                    });
                });

                // Se achamos um número razoável de times (ex: >10), confiamos nessa lista!
                if (teams.length >= 10) {
                    console.log(`✅ [API] Sucesso! ${teams.length} times encontrados na Tabela.`);
                    return teams;
                }
            }
        } catch (err) {
            console.warn("⚠️ Tabela indisponível, tentando método padrão...", err);
        }

        // 2. ESTRATÉGIA PADRÃO (FALLBACK)
        // Se não tem tabela (ex: pré-temporada), pegamos a lista completa de inscritos.
        const response = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);
        if (response && response.length > 0) {
            console.log(`⚠️ [API] Usando lista bruta de times (${response.length} encontrados).`);
            return response.map((item: any) => ({
                id: item.team.id,
                name: item.team.name,
                logo: item.team.logo
            }));
        }
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

    // A API aceita no máximo 20 IDs por vez separados por traço
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