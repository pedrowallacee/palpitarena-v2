'use client'

import { useState } from "react"
import { fetchMatchesFromApiAction } from "@/actions/fetch-matches-action"
import { saveSelectedMatches } from "@/actions/save-selected-matches-action"

interface MatchSelectorProps {
    roundId: string
    championshipSlug: string
}

export function MatchSelector({ roundId, championshipSlug }: MatchSelectorProps) {
    const [date, setDate] = useState("")
    const [matches, setMatches] = useState<any[]>([])
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedMatches, setSelectedMatches] = useState<any[]>([])

    async function handleSearch() {
        if (!date) return alert("Selecione uma data!")
        setLoadingSearch(true)
        setSelectedMatches([])

        const res = await fetchMatchesFromApiAction(0, date)
        setLoadingSearch(false)

        if (res?.success) {
            setMatches(res.matches || [])
        } else {
            alert(res?.message || "Erro ao buscar jogos")
        }
    }

    function toggleMatchSelection(match: any) {
        const matchId = match.apiId || match.externalId
        const isSelected = selectedMatches.some(m => (m.apiId || m.externalId) === matchId)

        if (isSelected) {
            setSelectedMatches(prev => prev.filter(m => (m.apiId || m.externalId) !== matchId))
        } else {
            setSelectedMatches(prev => [...prev, match])
        }
    }

    async function handleSaveSelected() {
        if (selectedMatches.length === 0) return
        setSaving(true)

        const res = await saveSelectedMatches(selectedMatches, roundId, championshipSlug)
        setSaving(false)

        if (res?.success) {
            const savedIds = selectedMatches.map(m => m.apiId || m.externalId)
            setMatches(prev => prev.filter(m => !savedIds.includes(m.apiId || m.externalId)))
            setSelectedMatches([])
        } else {
            alert("Erro ao salvar: " + (res?.error || "Erro desconhecido"))
        }
    }

    return (
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 md:p-6 mb-8 shadow-2xl relative overflow-hidden">

            {/* BACKGROUND GLOW */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

            <h3 className="text-lg md:text-xl font-black italic font-teko uppercase text-white mb-6 flex items-center gap-2 relative z-10">
                <span className="text-emerald-500 text-2xl">📡</span> Buscar Jogos
            </h3>

            {/* INPUTS DE BUSCA */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 relative z-10">
                <div className="relative flex-1">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:bg-black/60 transition-all font-bold text-sm [color-scheme:dark]"
                    />
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loadingSearch}
                    className="px-6 py-3 bg-white/5 hover:bg-emerald-500 hover:text-black text-white border border-white/10 hover:border-emerald-500 font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                    {loadingSearch ? "..." : "🔍 Buscar"}
                </button>
            </div>

            {/* GRID DE JOGOS */}
            {matches.length > 0 && (
                // ADICIONEI 'pb-24' PARA O ÚLTIMO CARD NÃO FICAR ESCONDIDO ATRÁS DA BARRA FLUTUANTE
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10 pb-24 md:pb-0">
                    {matches.map((match: any, index: number) => {
                        const matchId = match.apiId || match.externalId
                        const isSelected = selectedMatches.some(m => (m.apiId || m.externalId) === matchId)

                        const gameDate = new Date(match.date)
                        const timeString = gameDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                        return (
                            <div
                                key={index}
                                onClick={() => toggleMatchSelection(match)}
                                className={`
                                    cursor-pointer p-3 rounded-xl flex flex-col items-center justify-between group transition-all relative overflow-hidden border select-none
                                    ${isSelected
                                    ? "bg-emerald-900/10 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
                                    : "bg-[#1a1a1a] border-white/5 active:scale-[0.98]"
                                }
                                `}
                            >
                                {/* HEADER DO CARD: LIGA E HORA */}
                                <div className="w-full flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        {match.leagueLogo && <img src={match.leagueLogo} className="w-3 h-3 object-contain opacity-70" />}
                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider truncate max-w-[120px]">
                                            {match.leagueName || match.league}
                                        </span>
                                    </div>

                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isSelected ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black/40 text-gray-400 border-white/10'}`}>
                                        {isSelected && <span>✓</span>}
                                        {timeString}
                                    </div>
                                </div>

                                {/* TIMES */}
                                <div className="flex items-center justify-between w-full">
                                    {/* MANDANTE */}
                                    <div className="flex flex-col items-center w-[40%]">
                                        <img src={match.homeLogo} className="w-10 h-10 mb-2 object-contain drop-shadow-md" alt="" />
                                        <span className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                            {match.homeTeam}
                                        </span>
                                    </div>

                                    <span className={`font-black text-lg ${isSelected ? 'text-emerald-500' : 'text-gray-700'}`}>VS</span>

                                    {/* VISITANTE */}
                                    <div className="flex flex-col items-center w-[40%]">
                                        <img src={match.awayLogo} className="w-10 h-10 mb-2 object-contain drop-shadow-md" alt="" />
                                        <span className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                            {match.awayTeam}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* --- BARRA FLUTUANTE (DOCK) PARA MOBILE E DESKTOP --- */}
            {selectedMatches.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-[#121212]/90 backdrop-blur-xl border border-emerald-500/50 rounded-2xl p-2 pl-4 flex items-center justify-between shadow-[0_0_40px_rgba(0,0,0,0.8)]">

                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-black font-black text-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                                {selectedMatches.length}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Jogos Selecionados</span>
                                <span className="text-[9px] text-gray-400 leading-none">Toque em confirmar</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSelected}
                            disabled={saving}
                            className="px-6 py-3 bg-white hover:bg-emerald-400 text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
                        >
                            {saving ? (
                                <span className="animate-pulse">Salvando...</span>
                            ) : (
                                <>CONFIRMAR <span className="text-lg leading-none">➜</span></>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Feedback Vazio */}
            {matches.length === 0 && !loadingSearch && date && (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-gray-500 text-sm">Nenhum jogo encontrado nesta data.</p>
                </div>
            )}
        </div>
    )
}