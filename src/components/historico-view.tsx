'use client'

import { useState } from "react"
import Link from "next/link"
import { Trophy, ChevronLeft, Crown, Calendar, TrendingUp, Target, Medal, Info, Star, Shield, Flag, Globe, Globe2 } from "lucide-react"

// Componente Visual das Badges
function RankBadge({ position }: { position: number }) {
    if (position === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-500/20"><Trophy className="w-4 h-4 text-black fill-current" /></div>
    if (position === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-500/30 ring-2 ring-slate-400/20"><Medal className="w-4 h-4 text-slate-800" /></div>
    if (position === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/20"><Medal className="w-4 h-4 text-orange-900" /></div>
    return <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-gray-400">{position}º</div>
}

// Componente dos Cards de Pontuação (Rodapé)
function ScoreCard({ icon, title, color, points }: any) {
    const colors: any = {
        blue: "text-blue-400 border-blue-500/30 bg-blue-500/5 group-hover:bg-blue-500/10",
        emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 group-hover:bg-emerald-500/10",
        purple: "text-purple-400 border-purple-500/30 bg-purple-500/5 group-hover:bg-purple-500/10",
        yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5 group-hover:bg-yellow-500/10",
    }
    const theme = colors[color]

    return (
        <div className={`rounded-2xl p-6 border border-white/5 text-center transition-all relative overflow-hidden group hover:border-opacity-50 hover:-translate-y-1 flex flex-col items-center ${theme.replace('text-', 'border-').split(' ')[1]}`}>
            <div className={`absolute inset-0 transition-colors ${theme.split(' ').slice(2).join(' ')}`} />
            <div className="relative z-10 flex flex-col items-center w-full">
                <div className={`mb-4 p-3 rounded-full bg-black/20 border border-white/5 shadow-inner`}>
                    {icon}
                </div>
                <h3 className={`text-lg font-black uppercase mb-6 ${theme.split(' ')[0]}`}>{title}</h3>
                <div className="space-y-3 text-sm font-mono w-full">
                    {points.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-400 uppercase text-xs font-bold pt-1">{p.label}</span>
                            <span className="text-white font-black text-base">{p.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

interface HistoricoViewProps {
    season1Data: any
    season2Data: any
}

export function HistoricoView({ season1Data, season2Data }: HistoricoViewProps) {
    const [season, setSeason] = useState<'season1' | 'season2'>('season2')

    // Escolhe os dados com base na aba
    const currentData = season === 'season1' ? season1Data : season2Data

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">

            {/* HERO */}
            <div className="relative bg-[#121212] border-b border-white/5 pb-12 pt-10 md:pt-12 mb-8">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                    <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors bg-white/5 px-4 py-2 rounded-full text-sm font-bold">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar ao Início
                    </Link>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-3xl md:text-6xl font-black font-teko uppercase tracking-wide bg-gradient-to-r from-emerald-400 to-emerald-700 bg-clip-text text-transparent leading-tight">
                                Sala de Troféus
                            </h1>
                            <p className="text-gray-400 mt-3 text-base md:text-lg max-w-lg">
                                Hall da Fama e Histórico dos Campeões do Palpita Arena.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/10 p-5 rounded-full border border-yellow-500/20 self-start md:self-auto shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                            <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO */}
            <div className="max-w-7xl mx-auto px-6 md:px-8">

                {/* SELETOR DE TEMPORADA */}
                <div className="flex justify-center mb-12 md:mb-16">
                    <div className="bg-[#1a1a1a] p-1.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-2 shadow-2xl w-full sm:w-auto">
                        <button onClick={() => setSeason('season1')} className={`px-6 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${season === 'season1' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <Calendar className="w-4 h-4"/>
                            <span className="text-sm">1ª Temporada</span>
                        </button>
                        <button onClick={() => setSeason('season2')} className={`px-6 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${season === 'season2' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <Calendar className="w-4 h-4"/>
                            <span className="text-sm">2ª Temporada <span className="text-[10px] ml-1 opacity-70">(Atual)</span></span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* ESQUERDA: RANKING E STATS */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-8 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2 custom-scrollbar">

                        {/* RANKING */}
                        <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/5">
                            <div className="bg-[#1a1a1a] p-5 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                                <h3 className="font-black font-teko uppercase text-2xl text-white tracking-wide flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-emerald-500" />
                                    Ranking Geral
                                </h3>
                                <span className="text-[10px] font-bold text-gray-500 uppercase bg-black/40 px-2 py-1 rounded border border-white/5">Pontos Totais</span>
                            </div>

                            <div className="divide-y divide-white/5">
                                {currentData.ranking.length > 0 ? currentData.ranking.map((player: any, index: number) => (
                                    <div key={index} className={`flex items-center justify-between p-4 transition-all ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-l-2 border-yellow-500' : 'hover:bg-white/5 border-l-2 border-transparent hover:border-white/10'}`}>
                                        <div className="flex items-center gap-4">
                                            <RankBadge position={index + 1} />
                                            <span className={`font-bold uppercase tracking-wide ${index === 0 ? 'text-yellow-400 text-lg drop-shadow-sm' : index < 3 ? 'text-white' : 'text-gray-400 text-sm'}`}>{player.name}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`font-black font-mono text-lg leading-none ${index === 0 ? 'text-yellow-400' : index < 3 ? 'text-white' : 'text-emerald-500'}`}>{player.points}</span>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase">Pts</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500 text-sm italic">
                                        Nenhum ponto registrado ainda.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STATS (Destaques) */}
                        <div className="space-y-4">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-1 mb-2 flex items-center gap-2">
                                <Star className="w-3 h-3 text-emerald-500" />
                                Destaques da Temporada
                            </h3>
                            {currentData.stats.map((stat: any, idx: number) => (
                                <div key={idx} className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 hover:border-emerald-500/30 transition-all shadow-md group">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-white/5 pb-2 group-hover:text-emerald-400 transition-colors">
                                        {stat.icon}
                                        {stat.title}
                                    </div>
                                    <div className="space-y-2 pt-1">
                                        {stat.data.map((d: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <span className="text-white font-bold text-sm">{d.name}</span>
                                                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                    {d.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* DIREITA: GALERIA DE TROFÉUS */}
                    <div className="lg:col-span-8 mt-8 lg:mt-0">
                        <div className="flex items-center gap-3 mb-8 pl-1">
                            <Crown className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-3xl md:text-4xl font-black font-teko uppercase text-white tracking-wide">
                                Campeões por Liga
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentData.champions.map((item: any, index: number) => (
                                <div key={index} className="bg-[#121212] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1">

                                    <div className="absolute top-[-10px] right-[-10px] p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-125 duration-700 grayscale">
                                        <span className="text-8xl">{item.flag}</span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-6 relative z-10 border-b border-white/5 pb-4">
                                        <span className="text-3xl drop-shadow-md bg-white/5 p-2 rounded-lg">{item.flag}</span>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Liga</span>
                                            <h3 className="text-lg md:text-xl font-black font-teko uppercase tracking-wide text-gray-200 group-hover:text-emerald-400 transition-colors leading-none">
                                                {item.league}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3 relative z-10">
                                        {/* 1º Lugar */}
                                        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-transparent p-3 rounded-lg border border-yellow-500/10">
                                            <div className="flex items-center gap-3">
                                                <Crown className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                                <span className={`text-sm font-bold uppercase tracking-wide ${item.podium[0] ? 'text-yellow-100' : 'text-gray-600'}`}>
                                                    {item.podium[0] || "Em disputa..."}
                                                </span>
                                            </div>
                                            {item.podium[0] && <span className="text-[10px] font-black text-yellow-500 uppercase">Campeão</span>}
                                        </div>

                                        {/* 2º e 3º Lugar */}
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="flex flex-col px-2">
                                                <div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div><span className="text-[10px] text-gray-500 font-bold uppercase">Vice</span></div>
                                                <span className={`text-xs font-bold ${item.podium[1] ? 'text-gray-300' : 'text-gray-700'}`}>{item.podium[1] || "---"}</span>
                                            </div>
                                            <div className="flex flex-col px-2 border-l border-white/5">
                                                <div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-700"></div><span className="text-[10px] text-gray-500 font-bold uppercase">3º Lugar</span></div>
                                                <span className={`text-xs font-bold ${item.podium[2] ? 'text-gray-400' : 'text-gray-700'}`}>{item.podium[2] || "---"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RODAPÉ */}
                <div className="mt-32 border-t border-white/10 pt-16">
                    <div className="flex items-center gap-3 mb-8 pl-1">
                        <Info className="w-5 h-5 text-gray-500" />
                        <h2 className="text-xl md:text-2xl font-black font-teko uppercase text-gray-400 tracking-wide">
                            Critérios de Pontuação do Ranking
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ScoreCard icon={<Flag className="w-8 h-8 text-blue-400"/>} title="Ligas Nacionais" color="blue" points={[{ label: "Campeão", val: 800 }, { label: "Vice", val: 400 }, { label: "3º Lugar", val: 200 }]} />
                        <ScoreCard icon={<Trophy className="w-8 h-8 text-emerald-400"/>} title="Copas / Continentais" color="emerald" points={[{ label: "Campeão", val: 1200 }, { label: "Vice", val: 700 }, { label: "3º Lugar", val: 350 }]} />
                        <ScoreCard icon={<Globe className="w-8 h-8 text-purple-400"/>} title="Mundial de Clubes" color="purple" points={[{ label: "Campeão", val: 2500 }, { label: "Vice", val: 900 }, { label: "3º Lugar", val: 450 }]} />
                        <ScoreCard icon={<Globe2 className="w-8 h-8 text-yellow-400"/>} title="Copa do Mundo" color="yellow" points={[{ label: "Campeão", val: 5000 }, { label: "Vice", val: 1500 }, { label: "3º Lugar", val: 750 }]} />
                    </div>
                </div>
            </div>
        </div>
    )
}