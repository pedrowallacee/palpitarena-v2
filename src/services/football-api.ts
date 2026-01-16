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
        if (!cred.key) {
            console.log(`⚠️ Chave #${index + 1} não configurada.`);
            continue;
        }

        try {
            console.log(`📡 [API] Tentando credencial #${index + 1} para: ${endpoint}`);

            const res = await fetch(`${cred.baseUrl}${endpoint}`, {
                method: "GET",
                headers: {
                    [cred.authHeader]: cred.key,
                    "x-rapidapi-host": cred.host
                },
                next: { revalidate: cacheDuration }
            });

            const data = await res.json();

            // LOG DE ERRO (Crucial para a gente entender o que está rolando)
            if (data.errors && Object.keys(data.errors).length > 0) {
                console.error(`⛔ [BLOQUEIO API] Chave #${index + 1}:`, JSON.stringify(data.errors));
                continue; // Tenta a próxima chave
            }

            if (!data.response) {
                console.warn(`⚠️ [VAZIO] Chave #${index + 1} retornou sem dados.`);
                continue;
            }

            return data.response;

        } catch (error) {
            console.error(`🔥 [ERRO CRÍTICO] Chave #${index + 1} falhou:`, error);
        }
    }
    return null;
}

// =====================================================================
// 🚜 BUSCA SIMPLIFICADA (SEM FIRULA)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // DEFINIÇÃO MANUAL DE TEMPORADAS SEGURAS (JANEIRO/2026)
    // Europa (Premier, La Liga): Temporada 2025 (25/26) é a atual e cheia.
    // Brasil (Brasileirão, Copa BR): Temporada 2025 é a última completa. 2026 pode estar vazia.
    // SOLUÇÃO: Vamos focar em 2025 para TODOS. É o ano "mágico" agora.
    const primarySeason = 2025;
    const fallbackSeason = 2024;

    console.log(`🏁 [START] Buscando times para Liga ${leagueId} (Foco em ${primarySeason})...`);

    // TENTATIVA 1: TABELA 2025 (Melhor cenário)
    try {
        const standings = await fetchAPI(`/standings?league=${leagueId}&season=${primarySeason}`, 3600);
        if (standings && standings.length > 0 && standings[0].league?.standings) {
            let teams: APITeam[] = [];
            standings[0].league.standings.forEach((group: any[]) => {
                group.forEach((pos: any) => {
                    teams.push({ id: pos.team.id, name: pos.team.name, logo: pos.team.logo });
                });
            });
            if (teams.length > 4) {
                // Remove duplicatas e retorna
                const unique = Array.from(new Map(teams.map(t => [t.id, t])).values());
                unique.sort((a, b) => a.name.localeCompare(b.name));
                console.log(`✅ [SUCESSO] ${unique.length} times encontrados na Tabela ${primarySeason}.`);
                return unique;
            }
        }
    } catch (e) { console.error("Erro na tabela:", e); }

    // TENTATIVA 2: LISTA DE TIMES 2025
    try {
        const teamsList = await fetchAPI(`/teams?league=${leagueId}&season=${primarySeason}`, 86400);
        if (teamsList && teamsList.length > 4) {
            const formatted = teamsList.map((t: any) => ({
                id: t.team.id,
                name: t.team.name,
                logo: t.team.logo
            }));
            console.log(`✅ [SUCESSO] ${formatted.length} times encontrados na Lista ${primarySeason}.`);
            return formatted;
        }
    } catch (e) { console.error("Erro na lista:", e); }

    // TENTATIVA 3: FALLBACK PARA 2024 (Se 2025 falhou total)
    console.log(`⚠️ [FALLBACK] Tentando ano anterior (${fallbackSeason})...`);
    try {
        const fallbackList = await fetchAPI(`/teams?league=${leagueId}&season=${fallbackSeason}`, 86400);
        if (fallbackList && fallbackList.length > 4) {
            const formatted = fallbackList.map((t: any) => ({
                id: t.team.id,
                name: t.team.name,
                logo: t.team.logo
            }));
            console.log(`✅ [SALVOS PELO GONGO] ${formatted.length} times encontrados em ${fallbackSeason}.`);
            return formatted;
        }
    } catch (e) { /* silent */ }

    console.error(`❌ [FALHA TOTAL] Nenhum time encontrado para a Liga ${leagueId}.`);
    return [];
}

// --- OUTRAS FUNÇÕES ---

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