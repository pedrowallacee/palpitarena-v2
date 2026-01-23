'use client'

import { useState } from "react"
import { Trophy, Medal, Star, Target, Crown, Calendar, Globe } from "lucide-react"

// --- DADOS HISTÓRICOS (COPIADOS DO SEU TEXTO) ---
const SEASON_1 = {
    ranking: [
        { name: "Pedro", points: 6300, rank: 1 },
        { name: "Nikão", points: 3700, rank: 2 },
        { name: "Bruno", points: 3650, rank: 3 },
        { name: "Lucas", points: 3200, rank: 4 },
        { name: "Oscar", points: 2600, rank: 5 },
        { name: "Sulivan", points: 2400, rank: 6 },
        { name: "Diogo", points: 1950, rank: 7 },
        { name: "Jefferson", points: 1650, rank: 8 },
        { name: "Lincoln", points: 1600, rank: 9 },
        { name: "Gabriel", points: 1100, rank: 10 },
        { name: "Ramon", points: 1000, rank: 11 },
        { name: "Thiago", points: 800, rank: 12 },
        { name: "Nathan", points: 400, rank: 13 },
        { name: "Italo", points: 350, rank: 14 },
    ],
    stats: {
        bestCampaign: [{ name: "Italo", value: "6/6/0/0" }],
        cartelaGoals: [{ name: "Oscar", value: "30" }, { name: "Bruno", value: "29" }],
        leagueGoals: [{ name: "Lucas R.", value: "77" }, { name: "Lincoln", value: "74" }],
        worldCupGoals: [{ name: "Gabriel", value: "196" }, { name: "Pedro", value: "196" }]
    },
    championships: [
        { name: "Brasileirão A", flag: "🇧🇷", podium: ["Ramon", "Lincoln", "Sulivan"] },
        { name: "Brasileirão B", flag: "🇧🇷", podium: ["Nicolas", "Bruno", "Sulivan"] },
        { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", podium: ["Bruno", "Diogo", "Thiago"] },
        { name: "Serie A Tim", flag: "🇮🇹", podium: ["Sulivan", "Lucas", "Lincoln"] },
        { name: "La Liga", flag: "🇪🇸", podium: ["Oscar", "Nathan", "Ian"] },
        { name: "Bundesliga", flag: "🇩🇪", podium: ["Lucas", "Bruno", "Nicolas"] },
        { name: "Ligue 1", flag: "🇫🇷", podium: ["Sulivan", "Diogo", "Ramon"] },
        { name: "Liga Portugal", flag: "🇵🇹", podium: ["Diogo", "Thiago", "Nicolas"] },
        { name: "Eredivisie", flag: "🇳🇱", podium: ["Nicolas", "Jefferson", "Thiago"] },
        { name: "Liga Argentina", flag: "🇦🇷", podium: ["Pedro", "Sulivan", "Jefferson"] },
        { name: "MLS", flag: "🇺🇸", podium: ["Pedro", "Oscar", "Nicolas"] },
        { name: "Champions", flag: "🌐", podium: ["Pedro", "Jefferson", "Diogo"] },
        { name: "Europa League", flag: "🌐", podium: ["Lucas", "Oscar", "Gabriel"] },
        { name: "Libertadores", flag: "🔱", podium: ["Lincoln", "Pedro", "Bruno"] },
        { name: "Copa do Brasil", flag: "🔰", podium: ["Bruno", "Oscar", "Italo"] },
        { name: "Mundial Clubes", flag: "🌍", podium: ["Lucas", "Bruno", "Jefferson"] },
        { name: "Copa do Mundo", flag: "🌍", podium: ["Pedro", "Nicolas", "Gabriel"] },
    ]
}

const SEASON_2 = {
    ranking: [
        { name: "Lucas Ferreira", points: 2400, rank: 1 },
        { name: "Jefferson", points: 1600, rank: 2 },
        { name: "Lincoln", points: 1400, rank: 3 },
        { name: "Oscar", points: 1200, rank: 4 },
        { name: "Bruninho", points: 800, rank: 5 },
        { name: "Ramon", points: 800, rank: 6 },
        { name: "Gabriel", points: 600, rank: 7 },
        { name: "Sulivan", points: 600, rank: 8 },
        { name: "Nicolas", points: 200, rank: 9 },
        { name: "Giovan", points: 200, rank: 10 },
    ],
    stats: {
        bestCampaign: null,
        cartelaGoals: [{ name: "Lucas Ferreira", value: "24" }, { name: "Giovan", value: "24" }],
        leagueGoals: [{ name: "Lucas Ferreira", value: "87" }, { name: "Nicolas", value: "87" }],
        worldCupGoals: null
    },
    championships: [
        { name: "Brasileirão A", flag: "🇧🇷", podium: ["Lucas Ferreira", "Ramon", "Giovan"] },
        { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", podium: ["Lincoln", "Lucas Ferreira", "Gabriel"] },
        { name: "Serie A Tim", flag: "🇮🇹", podium: ["Jefferson", "Oscar", "Lucas Ferreira"] },
        { name: "La Liga", flag: "🇪🇸", podium: ["Bruninho", "Gabriel", "Lincoln"] },
        { name: "Bundesliga", flag: "🇩🇪", podium: ["Lucas Ferreira", "Lincoln", "Sulivan"] },
        { name: "Ligue 1", flag: "🇫🇷", podium: ["Oscar", "Sulivan", "Lucas Ferreira"] },
        { name: "Liga Portugal", flag: "🇵🇹", podium: ["Sulivan", "Italo", "Gabriel"] },
        { name: "Eredivisie", flag: "🇳🇱", podium: ["Jefferson", "Ramon", "Nicolas"] },
    ]
}

interface Props {
    liveUsers: any[] // Dados vindos do Banco
    liveHallOfFame: any[] // Dados vindos do Banco
}

export function RankingInterface({ liveUsers, liveHallOfFame }: Props) {
    const [activeTab, setActiveTab] = useState<'LIVE' | 'S2' | 'S1'>('LIVE')

    // Seleciona os dados com base na aba (S2 e S1 são estáticos, LIVE vem do banco)
    const staticData = activeTab === 'S1' ? SEASON_1 : SEASON_2

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">

            {/* --- CABEÇALHO --- */}
            <div className="text-center mb-10">
                <h1 className="text-5xl font-black italic font-teko uppercase text-white tracking-wide mb-2">
                    <span className="text-yellow-500">☆</span> Galeria de Lendas <span className="text-yellow-500">☆</span>
                </h1>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">
                    Hall da Fama do Palpita Arena
                </p>

                {/* BOTÕES DE ABA */}
                <div className="flex justify-center flex-wrap gap-2">
                    <button onClick={() => setActiveTab('LIVE')} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'LIVE' ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}>
                        Ranking Atual
                    </button>
                    <button onClick={() => setActiveTab('S2')} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'S2' ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}>
                        2ª Temporada
                    </button>
                    <button onClick={() => setActiveTab('S1')} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'S1' ? 'bg-yellow-600 text-black border-yellow-600 shadow-lg' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}>
                        1ª Temporada
                    </button>
                </div>
            </div>

            {/* === CONTEÚDO AO VIVO (DO BANCO) === */}
            {activeTab === 'LIVE' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden mb-8">
                        <div className="p-4 bg-[#1a1a1a] border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-emerald-500 font-black font-teko text-xl uppercase">Ranking Geral (Ao Vivo)</h3>
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-bold animate-pulse">● EM ANDAMENTO</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {liveUsers.map((user, i) => (
                                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black ${i === 0 ? 'bg-yellow-500 text-black' : i < 3 ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-500 border border-white/10'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-200">{user.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black font-teko text-white">{user.globalPoints}</p>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase">Pontos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Dinâmicos (Gols na Cartela) */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl grayscale group-hover:grayscale-0 transition-all">⚽</div>
                        <h2 className="text-2xl font-black font-teko uppercase text-white mb-6 border-b border-white/10 pb-2 inline-block px-8">☆ Gols na Cartela ☆</h2>
                        <div className="flex flex-col gap-3 items-center">
                            {liveHallOfFame.map((record, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-lg">
                                    <span className="text-2xl">{idx === 0 ? '👑' : '🥈'}</span>
                                    <span className="font-bold text-gray-300 uppercase">{record.name}</span>
                                    <span className="font-black text-emerald-400 font-teko text-2xl">{record.value} ⚽</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* === CONTEÚDO HISTÓRICO (S1 e S2) === */}
            {(activeTab === 'S1' || activeTab === 'S2') && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* ESTATÍSTICAS DESTAQUE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Melhor Campanha */}
                        {staticData.stats.bestCampaign && (
                            <div className="bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
                                <Crown className="w-8 h-8 text-orange-500 mb-2" />
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Melhor Campanha</h3>
                                {staticData.stats.bestCampaign.map((s, i) => (
                                    <div key={i}><p className="text-xl font-black font-teko uppercase text-white">{s.name}</p><p className="text-xs font-mono text-orange-400">{s.value}</p></div>
                                ))}
                            </div>
                        )}
                        {/* Gols na Cartela */}
                        <div className="bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
                            <Target className="w-8 h-8 text-emerald-500 mb-2" />
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gols na Cartela</h3>
                            {staticData.stats.cartelaGoals.map((s, i) => (
                                <div key={i}><span className="text-sm font-black uppercase text-white mr-1">{s.name}</span><span className="text-xs text-emerald-400 font-bold">{s.value} ⚽</span></div>
                            ))}
                        </div>
                        {/* Gols Liga */}
                        <div className="bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
                            <Trophy className="w-8 h-8 text-blue-500 mb-2" />
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reis das Ligas</h3>
                            {staticData.stats.leagueGoals.map((s, i) => (
                                <div key={i}><span className="text-sm font-black uppercase text-white mr-1">{s.name}</span><span className="text-xs text-blue-400 font-bold">{s.value} ⚽</span></div>
                            ))}
                        </div>
                        {/* Gols Copa (Se houver) */}
                        {staticData.stats.worldCupGoals && (
                            <div className="bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center">
                                <Globe className="w-8 h-8 text-purple-500 mb-2" />
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reis da Copa</h3>
                                {staticData.stats.worldCupGoals.map((s, i) => (
                                    <div key={i}><span className="text-sm font-black uppercase text-white mr-1">{s.name}</span><span className="text-xs text-purple-400 font-bold">{s.value} ⚽</span></div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* RANKING DA TEMPORADA */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden sticky top-8">
                                <div className="p-4 border-b border-white/5 bg-[#151515] flex items-center justify-between">
                                    <h2 className="text-xl font-black italic font-teko uppercase text-white flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" /> Ranking Final
                                    </h2>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {staticData.ranking.map((p, i) => (
                                        <div key={i} className={`flex items-center justify-between p-3 ${i < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-700 text-white' : 'bg-[#1a1a1a] text-gray-500'}`}>{p.rank}</div>
                                                <span className={`text-sm font-bold uppercase ${i === 0 ? 'text-yellow-500' : 'text-gray-300'}`}>{p.name}</span>
                                            </div>
                                            <span className="font-mono font-bold text-sm text-white">{p.points}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* LISTA DE CAMPEÕES */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                            {staticData.championships.map((champ, i) => (
                                <div key={i} className="bg-[#121212] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                        <span className="text-xl">{champ.flag}</span>
                                        <h3 className="font-black font-teko uppercase text-lg text-white truncate">{champ.name}</h3>
                                    </div>
                                    {champ.podium.length > 0 ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs"><span className="text-yellow-500 font-bold">1º {champ.podium[0]}</span></div>
                                            <div className="flex justify-between text-[10px] text-gray-400"><span>2º {champ.podium[1]}</span><span>3º {champ.podium[2]}</span></div>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] uppercase text-gray-600 font-bold bg-white/5 p-1 text-center rounded">Em Aberto</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}