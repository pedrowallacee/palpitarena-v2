import { prisma } from "@/lib/prisma"
import { COMPETITION_LIST, COMPETITION_CATEGORIES } from "@/lib/ranking-rules"
import { HistoricoView } from "@/components/historico-view"
import { Trophy, Target, TrendingUp, Star, Globe } from "lucide-react"

// --- DADOS DA TEMPORADA 1 (FIXOS) ---
const SEASON_1_DATA = {
    champions: [
        { league: "Brasileiro Série A", flag: "🇧🇷", podium: ["Ramon", "Lincoln", "Sulivan"] },
        { league: "Brasileiro Série B", flag: "🇧🇷", podium: ["Nicolas", "Bruno", "Sulivan"] },
        { league: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", podium: ["Bruno", "Diogo", "Thiago"] },
        { league: "Serie A TIM", flag: "🇮🇹", podium: ["Sulivan", "Lucas", "Lincoln"] },
        { league: "La Liga", flag: "🇪🇸", podium: ["Oscar", "Nathan", "Ian"] },
        { league: "Bundesliga", flag: "🇩🇪", podium: ["Lucas", "Bruno", "Nicolas"] },
        { league: "Ligue 1", flag: "🇫🇷", podium: ["Sulivan", "Diogo", "Ramon"] },
        { league: "Liga Portugal", flag: "🇵🇹", podium: ["Diogo", "Thiago", "Nicolas"] },
        { league: "Eredivisie", flag: "🇳🇱", podium: ["Nicolas", "Jefferson", "Thiago"] },
        { league: "Liga Profissional", flag: "🇦🇷", podium: ["Pedro", "Sulivan", "Jefferson"] },
        { league: "MLS", flag: "🇺🇸", podium: ["Pedro", "Oscar", "Nicolas"] },
        { league: "Champions League", flag: "🌐", podium: ["Pedro", "Jefferson", "Diogo"] },
        { league: "Europa League", flag: "🌐", podium: ["Lucas", "Oscar", "Gabriel"] },
        { league: "Libertadores", flag: "🔱", podium: ["Lincoln", "Pedro", "Bruno"] },
        { league: "Copa do Brasil", flag: "🔰", podium: ["Bruno", "Oscar", "Italo"] },
        { league: "Mundial de Clubes", flag: "🌍", podium: ["Lucas", "Bruno", "Jefferson"] },
        { league: "Copa do Mundo", flag: "🌍", podium: ["Pedro", "Nicolas", "Gabriel"] },
    ],
    ranking: [
        { name: "Pedro", points: 6300 },
        { name: "Nikão", points: 3700 },
        { name: "Bruno", points: 3650 },
        { name: "Lucas", points: 3200 },
        { name: "Oscar", points: 2600 },
        { name: "Sulivan", points: 2400 },
        { name: "Diogo", points: 1950 },
        { name: "Jefferson", points: 1650 },
        { name: "Lincoln", points: 1600 },
        { name: "Gabriel", points: 1100 },
        { name: "Ramon", points: 1000 },
        { name: "Thiago", points: 800 },
        { name: "Nathan", points: 400 },
        { name: "Italo", points: 350 },
    ],
    stats: [
        { title: "Melhor Campanha", icon: <Star className="w-5 h-5 text-yellow-400"/>, data: [{ name: "Italo", value: "6/6/0/0 (Invicto)" }] },
        { title: "Gols na Cartela", icon: <Target className="w-5 h-5 text-red-400"/>, data: [{ name: "Oscar", value: "30 ⚽" }, { name: "Bruno", value: "29 ⚽" }] },
        { title: "Gols no Campeonato", icon: <TrendingUp className="w-5 h-5 text-blue-400"/>, data: [{ name: "Lucas R.", value: "77 ⚽" }, { name: "Lincoln", value: "74 ⚽" }] },
        { title: "Gols Copa do Mundo", icon: <Trophy className="w-5 h-5 text-emerald-400"/>, data: [{ name: "Gabriel", value: "196 ⚽" }, { name: "Pedro", value: "196 ⚽" }] },
    ]
}

// --- DADOS DA TEMPORADA 2 (FIXOS - MANUALMENTE INSERIDOS CONFORME SEU TEXTO) ---
const SEASON_2_DATA_MANUAL = {
    champions: [
        { league: "Brasileiro Série A", flag: "🇧🇷", podium: ["Lucas Ferreira", "Ramon", "Giovan"] },
        { league: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", podium: ["Lincoln", "Lucas Ferreira", "Gabriel"] },
        { league: "Serie A TIM", flag: "🇮🇹", podium: ["Jefferson", "Oscar", "Lucas Ferreira"] },
        { league: "La Liga", flag: "🇪🇸", podium: ["Bruninho", "Gabriel", "Lincoln"] },
        { league: "Bundesliga", flag: "🇩🇪", podium: ["Lucas Ferreira", "Lincoln", "Sulivan"] },
        { league: "Ligue 1", flag: "🇫🇷", podium: ["Oscar", "Sulivan", "Lucas Ferreira"] },
        { league: "Liga Portugal", flag: "🇵🇹", podium: ["Sulivan", "Italo", "Gabriel"] },
        { league: "Eredivisie", flag: "🇳🇱", podium: ["Jefferson", "Ramon", "Nicolas"] },
        // Ligas em Aberto
        { league: "Liga Profissional", flag: "🇦🇷", podium: [null, null, null] },
        { league: "MLS", flag: "🇺🇸", podium: [null, null, null] },
        { league: "Liga Saudita", flag: "🇸🇦", podium: [null, null, null] },
        { league: "Liga All Stars", flag: "🇻🇳", podium: [null, null, null] },
        { league: "Champions League", flag: "🌐", podium: [null, null, null] },
        { league: "Europa League", flag: "🌐", podium: [null, null, null] },
        { league: "Libertadores", flag: "🔱", podium: [null, null, null] },
        { league: "Copa do Brasil", flag: "🔰", podium: [null, null, null] },
        { league: "Mundial de Clubes", flag: "🌍", podium: [null, null, null] },
        { league: "Copa do Mundo", flag: "🌍", podium: [null, null, null] },
    ],
    ranking: [
        { name: "Lucas Ferreira", points: 2400 },
        { name: "Jefferson", points: 1600 },
        { name: "Lincoln", points: 1400 },
        { name: "Oscar", points: 1200 },
        { name: "Bruninho", points: 800 },
        { name: "Ramon", points: 800 },
        { name: "Gabriel", points: 600 },
        { name: "Sulivan", points: 600 },
        { name: "Nicolas", points: 200 },
        { name: "Giovan", points: 200 },
    ],
    stats: [
        { title: "Gols na Cartela", icon: <Target className="w-5 h-5 text-red-400"/>, data: [{ name: "Lucas F.", value: "24 ⚽" }, { name: "Giovan", value: "24 ⚽" }] },
        { title: "GP das Ligas", icon: <TrendingUp className="w-5 h-5 text-blue-400"/>, data: [{ name: "Lucas F.", value: "87 ⚽" }, { name: "Nicolas", value: "87 ⚽" }] },
        { title: "GP das Copas", icon: <Trophy className="w-5 h-5 text-gray-400"/>, data: [{ name: "---", value: "-" }] },
        { title: "GP Mundial", icon: <Globe className="w-5 h-5 text-gray-400"/>, data: [{ name: "---", value: "-" }] },
    ]
}

export const dynamic = 'force-dynamic'

export default async function HistoricoPage() {

    return (
        <HistoricoView
            season1Data={SEASON_1_DATA}
            season2Data={SEASON_2_DATA_MANUAL}
        />
    )
}