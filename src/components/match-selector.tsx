'use client'

import { useState, useMemo } from "react"
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

    // Estados para controlar quais ligas estão expandidas/colapsadas
    const [collapsedLeagues, setCollapsedLeagues] = useState<string[]>([])

    // 1. AGRUPAR JOGOS POR LIGA (Organização Visual)
    const matchesByLeague = useMemo(() => {
        const groups: Record<string, any[]> = {}

        matches.forEach(match => {
            const leagueName = match.leagueName || match.league || "Outros"
            if (!groups[leagueName]) {
                groups[leagueName] = []
            }
            groups[leagueName].push(match)
        })

        // Ordena alfabeticamente pelo nome da liga
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
    }, [matches])

    async function handleSearch() {
        if (!date) return alert("Selecione uma data!")
        setLoadingSearch(true)
        setSelectedMatches([]) // Limpa seleção anterior ao buscar nova data

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

    // Função para selecionar/deselecionar todos de uma liga específica
    function toggleLeagueSelection(leagueMatches: any[]) {
        const allIds = leagueMatches.map(m => m.apiId || m.externalId)
        const allSelected = leagueMatches.every(m =>
            selectedMatches.some(s => (s.apiId || s.externalId) === (m.apiId || m.externalId))
        )

        if (allSelected) {
            // Remove todos dessa liga
            setSelectedMatches(prev => prev.filter(m => !allIds.includes(m.apiId || m.externalId)))
        } else {
            // Adiciona os que faltam (evita duplicatas)
            const newSelections = leagueMatches.filter(m =>
                !selectedMatches.some(s => (s.apiId || s.externalId) === (m.apiId || m.externalId))
            )
            setSelectedMatches(prev => [...prev, ...newSelections])
        }
    }

    function toggleLeagueCollapse(leagueName: string) {
        if (collapsedLeagues.includes(leagueName)) {
            setCollapsedLeagues(prev => prev.filter(l => l !== leagueName))
        } else {
            setCollapsedLeagues(prev => [...prev, leagueName])
        }
    }

    async function handleSaveSelected() {
        if (selectedMatches.length === 0) return
        setSaving(true)

        // Chama a Action de salvar (que deve usar a lógica de lote/batch)
        const res = await saveSelectedMatches(selectedMatches, roundId, championshipSlug)

        setSaving(false)

        if (res?.success) {
            // Remove os jogos salvos da lista visual
            const savedIds = selectedMatches.map(m => m.apiId || m.externalId)
            setMatches(prev => prev.filter(m => !savedIds.includes(m.apiId || m.externalId)))

            setSelectedMatches([]) // Limpa seleção
            alert("✅ Jogos adicionados com sucesso!")
        } else {
            alert("Erro ao salvar: " + (res?.error || res?.message || "Erro desconhecido"))
        }
    }

    return (
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 md:p-6 mb-8 shadow-2xl relative overflow-hidden">

            {/* BACKGROUND DECORATION */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

            <h3 className="text-lg md:text-xl font-black italic font-teko uppercase text-white mb-6 flex items-center gap-2 relative z-10">
                <span className="text-emerald-500 text-2xl">📡</span> Buscar Jogos na API
            </h3>

            {/* BARRA DE BUSCA (DATA) */}
            <div className="flex flex-col md:flex-row gap-3 mb-8 relative z-10">
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
                    {loadingSearch ? (
                        <span className="animate-spin">⏳</span>
                    ) : (
                        "🔍 Buscar"
                    )}
                </button>
            </div>

            {/* --- LISTA AGRUPADA POR LIGAS --- */}
            {matchesByLeague.length > 0 && (
                <div className="space-y-6 relative z-10 pb-24 md:pb-0">
                    {matchesByLeague.map(([leagueName, leagueMatches]) => {
                        const isCollapsed = collapsedLeagues.includes(leagueName)
                        const leagueLogo = leagueMatches[0].leagueLogo

                        // Verifica se todos dessa liga estão marcados
                        const allSelected = leagueMatches.length > 0 && leagueMatches.every(m =>
                            selectedMatches.some(s => (s.apiId || s.externalId) === (m.apiId || m.externalId))
                        )

                        return (
                            <div key={leagueName} className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-500">

                                {/* CABEÇALHO DA LIGA */}
                                <div className="bg-[#222] p-3 flex items-center justify-between border-b border-white/5 select-none">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => toggleLeagueCollapse(leagueName)}
                                    >
                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center p-1 border border-white/10">
                                            {leagueLogo ? (
                                                <img src={leagueLogo} alt={leagueName} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-[10px]">🏆</span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-200 uppercase tracking-wide flex items-center gap-2">
                                            {leagueName}
                                            <span className="text-[10px] text-gray-500 bg-black/40 px-1.5 py-0.5 rounded ml-1">
                                                {leagueMatches.length}
                                            </span>
                                        </h4>
                                    </div>

                                    {/* Botão Check All */}
                                    <button
                                        onClick={() => toggleLeagueSelection(leagueMatches)}
                                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${allSelected ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/20 hover:border-white/50 text-transparent hover:text-gray-500'}`}
                                        title="Selecionar todos desta liga"
                                    >
                                        ✓
                                    </button>
                                </div>

                                {/* LISTA DE JOGOS DA LIGA (GRID) */}
                                {!isCollapsed && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-[#161616]">
                                        {leagueMatches.map((match: any, idx: number) => {
                                            const matchId = match.apiId || match.externalId
                                            const isSelected = selectedMatches.some(m => (m.apiId || m.externalId) === matchId)
                                            const gameDate = new Date(match.date)
                                            const timeString = gameDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => toggleMatchSelection(match)}
                                                    className={`
                                                        cursor-pointer p-3 rounded-lg flex items-center justify-between group transition-all border select-none
                                                        ${isSelected
                                                        ? "bg-emerald-900/10 border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]"
                                                        : "bg-[#1f1f1f] border-white/5 hover:border-white/20"
                                                    }
                                                    `}
                                                >
                                                    {/* HORA */}
                                                    <div className="text-[10px] font-mono font-bold text-gray-500 border-r border-white/5 pr-3 mr-3 flex flex-col items-center min-w-[40px]">
                                                        {timeString}
                                                        {isSelected && <span className="text-emerald-500 text-xs">✔</span>}
                                                    </div>

                                                    {/* TIMES */}
                                                    <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                                        {/* Casa */}
                                                        <div className="flex items-center gap-2">
                                                            {match.homeLogo && <img src={match.homeLogo} className="w-5 h-5 object-contain" alt="" />}
                                                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                                {match.homeTeam}
                                                            </span>
                                                        </div>
                                                        {/* Fora */}
                                                        <div className="flex items-center gap-2">
                                                            {match.awayLogo && <img src={match.awayLogo} className="w-5 h-5 object-contain" alt="" />}
                                                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                                {match.awayTeam}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* --- BARRA FLUTUANTE (DOCK) --- */}
            {selectedMatches.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-[#121212]/95 backdrop-blur-xl border border-emerald-500/50 rounded-2xl p-2 pl-4 flex items-center justify-between shadow-[0_0_40px_rgba(0,0,0,0.8)]">

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
                                <>
                                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    <span>Salvando...</span>
                                </>
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