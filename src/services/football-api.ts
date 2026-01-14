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

// IDs das Ligas Suportadas
const SUPPORTED_LEAGUE_IDS = [
    71, 72, 13, 39, 40, 140, 135, 78, 61, 94, 88, 144, 253, 307, 2
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
            console.log(`🔌 [API] Tentando Credencial #${index + 1} na rota: ${endpoint}`);

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
                // Se for erro de plano, nem tenta logar como erro crítico, apenas avisa
                console.warn(`⚠️ [API RESTRIÇÃO] Credencial #${index + 1}:`, JSON.stringify(data.errors));
                continue;
            }

            if (!data.response) {
                continue;
            }

            return data.response;

        } catch (error) {
            console.error(`🔥 [API CRASH] Erro na credencial #${index + 1}:`, error);
        }
    }
    return null;
}

// NOVA FUNÇÃO: Tenta extrair times dos jogos (Burlar restrição de temporada)
async function getTeamsFromFixtures(leagueId: number, season: number): Promise<APITeam[]> {
    console.log(`🕵️ TÁTICA BACKDOOR: Tentando extrair times dos jogos da temporada ${season}...`);

    // Pede os próximos 50 jogos (geralmente cobre todos os times da liga)
    const matches = await fetchAPI(`/fixtures?league=${leagueId}&season=${season}&next=50`, 3600);

    if (!matches || matches.length === 0) return [];

    const uniqueTeams = new Map<number, APITeam>();

    matches.forEach((match: any) => {
        // Adiciona time da casa
        if (!uniqueTeams.has(match.teams.home.id)) {
            uniqueTeams.set(match.teams.home.id, {
                id: match.teams.home.id,
                name: match.teams.home.name,
                logo: match.teams.home.logo
            });
        }
        // Adiciona time visitante
        if (!uniqueTeams.has(match.teams.away.id)) {
            uniqueTeams.set(match.teams.away.id, {
                id: match.teams.away.id,
                name: match.teams.away.name,
                logo: match.teams.away.logo
            });
        }
    });

    const teams = Array.from(uniqueTeams.values());
    console.log(`✅ BACKDOOR SUCESSO: ${teams.length} times atuais extraídos dos jogos!`);
    return teams;
}

export async function getTeamsByLeague(leagueId: number): Promise<APITeam[]> {
    // 1. TENTA A TEMPORADA ATUAL (2025/2026) USANDO O TRUQUE DOS JOGOS
    // Isso deve retornar os times REAIS de hoje (Premier League 25/26)
    const currentTeams = await getTeamsFromFixtures(leagueId, 2025);

    if (currentTeams.length > 10) { // Se achou um número razoável de times
        return currentTeams.sort((a, b) => a.name.localeCompare(b.name));
    }

    // 2. SE FALHAR, TENTA O MÉTODO TRADICIONAL (LISTA)
    // Se a API bloquear até os jogos de 2025, voltamos para 2024
    console.warn("⚠️ Backdoor falhou. Tentando método tradicional (Listas)...");

    const seasonsToTry = [2025, 2024]; // Tenta lista oficial 2025, se não der, vai pra 2024

    for (const season of seasonsToTry) {
        console.log(`📡 Buscando lista oficial da Liga ${leagueId} (Temporada ${season})...`);
        const response = await fetchAPI(`/teams?league=${leagueId}&season=${season}`, 86400);

        if (response && response.length > 0) {
            console.log(`✅ Lista oficial obtida para ${season}.`);
            return response.map((item: any) => ({
                id: item.team.id,
                name: item.team.name,
                logo: item.team.logo
            }));
        }
    }

    console.error(`❌ FALHA TOTAL: Nenhum time encontrado.`);
    return [];
}

export async function getMatchesByDate(date: string): Promise<any[]> {
    const response = await fetchAPI(`/fixtures?date=${date}&timezone=America/Sao_Paulo`, 300);

    if (!response) return [];

    const filteredMatches = response.filter((item: any) =>
        SUPPORTED_LEAGUE_IDS.includes(item.league.id)
    );

    return filteredMatches.map((item: any) => ({
        apiId: item.fixture.id,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        date: item.fixture.date,
        time: new Date(item.fixture.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
        leagueName: item.league.name,
        leagueLogo: item.league.logo,
        status: item.fixture.status.short,
        homeScore: item.goals.home,
        awayScore: item.goals.away
    }));
}