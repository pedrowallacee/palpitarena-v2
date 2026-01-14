'use server'

const API_KEY = process.env.FOOTBALL_KEY_1
const BASE_URL = "https://v3.football.api-sports.io"

// 1. LISTA VIP (IDs Específicos das Ligas/Copas)
const PRIORITY_LEAGUES = [
    // --- MUNDIAIS & CONTINENTAIS ---
    1,   // Copa do Mundo
    2,   // Champions League
    13,  // Libertadores
    3,   // Europa League
    11,  // Sulamericana
    15,  // Mundial de Clubes

    // --- INGLATERRA ---
    39,  // Premier League
    45,  // FA Cup (Copa da Inglaterra) <--- IMPORTANTE
    48,  // Carabao Cup (Copa da Liga Inglesa)
    40,  // Championship (2ª Divisão Inglesa)

    // --- BRASIL ---
    71,  // Brasileirão Série A
    73,  // Copa do Brasil
    72,  // Brasileirão Série B

    // --- ESPANHA ---
    140, // La Liga
    143, // Copa del Rey

    // --- ITÁLIA ---
    135, // Serie A
    137, // Coppa Italia

    // --- OUTROS GIGANTES ---
    78,  // Bundesliga (Alemanha)
    81,  // DFB Pokal (Copa da Alemanha)
    61,  // Ligue 1 (França)
    66,  // Coupe de France
    94,  // Liga Portugal
    88,  // Eredivisie (Holanda)

    // --- POPULARES ---
    307, // Saudi Pro League
    253, // MLS (EUA)
    128, // Liga Argentina
]

// 2. PAÍSES VIP (Se não for liga VIP, mas for desses países, sobe na lista)
const PRIORITY_COUNTRIES = [
    "Brazil", "England", "Spain", "Italy", "Germany", "France", "Portugal", "Argentina", "International"
]

export async function fetchMatchesFromApiAction(ignoredLeagueId: number, date: string) {
    try {
        const url = `${BASE_URL}/fixtures?date=${date}&timezone=America/Sao_Paulo`

        const res = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY || "",
                "x-rapidapi-host": "v3.football.api-sports.io"
            },
            next: { revalidate: 120 }
        })

        const data = await res.json()

        if (!data.response || data.errors?.length > 0) {
            console.error("API Error:", data.errors)
            return { success: false, matches: [], message: "Erro na API." }
        }

        let matches = data.response.map((item: any) => ({
            apiId: item.fixture.id,
            date: item.fixture.date,
            status: item.fixture.status.short,
            homeTeam: item.teams.home.name,
            homeLogo: item.teams.home.logo,
            awayTeam: item.teams.away.name,
            awayLogo: item.teams.away.logo,
            leagueId: item.league.id,
            leagueName: item.league.name,
            leagueLogo: item.league.logo,
            country: item.league.country // Importante para o Nível 2
        }))

        // --- ALGORITMO DE ORDENAÇÃO INTELIGENTE ---
        matches.sort((a: any, b: any) => {
            // CRITÉRIO 1: ID da Liga está na Lista VIP?
            const indexA = PRIORITY_LEAGUES.indexOf(a.leagueId)
            const indexB = PRIORITY_LEAGUES.indexOf(b.leagueId)

            // Se ambos estão na VIP, ganha quem estiver mais no topo da lista
            if (indexA !== -1 && indexB !== -1) return indexA - indexB
            // Se só o A é VIP, ele vem antes
            if (indexA !== -1) return -1
            // Se só o B é VIP, ele vem antes
            if (indexB !== -1) return 1

            // CRITÉRIO 2: O País é importante? (Ex: Inglaterra, Brasil)
            const countryIndexA = PRIORITY_COUNTRIES.indexOf(a.country)
            const countryIndexB = PRIORITY_COUNTRIES.indexOf(b.country)

            if (countryIndexA !== -1 && countryIndexB !== -1) return countryIndexA - countryIndexB
            if (countryIndexA !== -1) return -1
            if (countryIndexB !== -1) return 1

            // CRITÉRIO 3: Ordem Alfabética do País (Para o resto não ficar bagunçado)
            // Indonésia vai vir depois de "France" mas antes de "Zimbabwe"
            return a.country.localeCompare(b.country)
        })

        return { success: true, matches }

    } catch (error) {
        console.error(error)
        return { success: false, matches: [] }
    }
}