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
// 🕵️‍♂️ DESCOBRIR TEMPORADA ATUAL (O SEGREDO UNIVERSAL)
// =====================================================================
async function getCurrentSeasonYear(leagueId: number): Promise<number> {
    // Pergunta para a API: "Qual temporada está ativa (current=true) para esta liga?"
    const response = await fetchAPI(`/leagues?id=${leagueId}&current=true`, 86400); // Cache de 1 dia

    if (response && response.length > 0 && response[0].seasons && response[0].seasons.length > 0) {
        const currentSeason = response[0].seasons[0].year;
        console.log(`📅 [API] Liga ${leagueId} está na temporada: ${currentSeason}`);
        return currentSeason;
    }

    // Se a API falhar ou não retornar nada, usamos o ano atual como "chute" de segurança
    const currentYear = new Date().getFullYear();
    console.warn(`⚠️ [API] Não foi possível detectar temporada. Usando ano atual: ${currentYear}`);
    return currentYear;
}

// =====================================================================
// 🏆 BUSCAR TIMES (INTELIGENTE E UNIVERSAL)
// =====================================================================
export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {

    // 1. Descobrir qual ano devemos buscar (Sem adivinhar!)
    const targetSeason = await getCurrentSeasonYear(leagueId);

    console.log(`🔎 [API] Buscando times da Liga ${leagueId} (Temporada ${targetSeason})...`)

    // 2. TENTATIVA A: BUSCAR VIA TABELA (STANDINGS)
    // A tabela é a "Prova Real". Quem está nela, está jogando o campeonato.
    try {
        const standingsRes = await fetchAPI(`/standings?league=${leagueId}&season=${targetSeason}`, 3600);

        if (standingsRes && standingsRes.length > 0 && standingsRes[0].league && standingsRes[0].league.standings) {
            const standings = standingsRes[0].league.standings;
            let teams: APITeam[] = [];

            // Extrai times de todos os grupos ou tabela única
            standings.forEach((groupOrTable: any[]) => {
                groupOrTable.forEach((position: any) => {
                    teams.push({
                        id: position.team.id,
                        name: position.team.name,
                        logo: position.team.logo
                    });
                });
            });

            // Se a tabela tem times, confiamos nela 100%
            if (teams.length >= 2) {
                // Remove duplicatas
                const uniqueTeams = Array.from(new Map(teams.map(t => [t.id, t])).values());
                console.log(`✅ [API] Sucesso! ${uniqueTeams.length} times vindos da Tabela.`);
                return uniqueTeams;
            }
        }
    } catch (err) {
        console.warn(`⚠️ Erro ao processar tabela:`, err);
    }

    // 3. TENTATIVA B: LISTA DE TIMES (INSCRITOS)
    // Se a tabela veio vazia (campeonato não começou ou erro na API), pegamos a lista oficial de times.
    console.log(`⚠️ [FALLBACK] Tabela vazia. Buscando lista de inscritos em ${targetSeason}...`);
    const fallbackRes = await fetchAPI(`/teams?league=${leagueId}&season=${targetSeason}`, 86400);

    if (fallbackRes && fallbackRes.length > 0) {
        console.log(`✅ [API] Lista de inscritos retornou ${fallbackRes.length} times.`);
        return fallbackRes.map((item: any) => ({
            id: item.team.id,
            name: item.team.name,
            logo: item.team.logo
        }));
    }

    return [];
}

// --- OUTRAS FUNÇÕES (MANTIDAS COM FUSO HORÁRIO CORRIGIDO) ---

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
        // Fuso horário mantido
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