'use client'

import { useState } from "react"
import { fetchAvailableMatches } from "@/actions/fetch-matches-action"
import { saveSelectedMatches } from "@/actions/save-selected-matches-action"

interface MatchSelectorProps {
    roundId: string
    slug: string
    defaultDate: string
}

export function MatchSelector({ roundId, slug, defaultDate }: MatchSelectorProps) {
    const [date, setDate] = useState(defaultDate)
    const [matches, setMatches] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success">("idle")

    // 1. Busca na API
    async function handleSearch() {
        setStatus("loading")
        setSelectedIds(new Set())
        setMatches([])

        // Agora a action retorna { success: boolean, matches: any[] }
        const res = await fetchAvailableMatches(date)

        if (res.success) {
            setMatches(res.matches)
            setStatus("idle")
        } else {
            alert("Erro ao buscar jogos!")
            setMatches([])
            setStatus("idle")
        }
    }

    // 2. Toggle do Checkbox
    function toggleMatch(apiId: number) {
        const newSet = new Set(selectedIds)
        if (newSet.has(apiId)) {
            newSet.delete(apiId)
        } else {
            newSet.add(apiId)
        }
        setSelectedIds(newSet)
    }

    // 3. Salva no Banco
    async function handleSaveSelected() {
        if (selectedIds.size === 0) return
        setStatus("saving")

        // Filtra comparando o ID real do jogo
        const selectedGames = matches.filter((match) => selectedIds.has(match.apiId))

        await saveSelectedMatches(selectedGames, roundId, slug)

        setMatches([])
        setSelectedIds(new Set())
        setStatus("success")
        setTimeout(() => setStatus("idle"), 3000)
    }

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-8 animate-in fade-in">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
                🔎 Scout de Jogos (Admin)
            </h3>

            {/* BARRA DE BUSCA */}
            <div className="flex gap-4 items-end mb-6">
                <div className="flex-1">
                    <label className="text-xs text-gray-400 block mb-1">Data da Partida</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded p-3 text-white [color-scheme:dark]"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={status === "loading"}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded transition-colors disabled:opacity-50"
                >
                    {status === "loading" ? "Buscando..." : "BUSCAR JOGOS"}
                </button>
            </div>

            {/* LISTA DE RESULTADOS */}
            {matches.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                        <span>Selecione os jogos para adicionar na rodada:</span>
                        <span>{selectedIds.size} selecionados</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
                        {matches.map((match) => (
                            <div
                                key={match.apiId}
                                onClick={() => toggleMatch(match.apiId)}
                                className={`
                                    cursor-pointer p-3 rounded-lg border flex items-center gap-4 transition-all select-none
                                    ${selectedIds.has(match.apiId)
                                    ? 'bg-emerald-500/10 border-emerald-500'
                                    : 'bg-black/20 border-white/5 hover:bg-white/5'}
                                `}
                            >
                                {/* Checkbox Visual */}
                                <div className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${selectedIds.has(match.apiId) ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-gray-600'}
                                `}>
                                    {selectedIds.has(match.apiId) && "✓"}
                                </div>

                                {/* Info do Jogo */}
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="flex items-center gap-3 w-[45%] justify-end">
                                        <span className="font-bold text-sm text-right leading-tight">{match.homeTeam}</span>
                                        <img src={match.homeLogo} className="w-6 h-6 object-contain" />
                                    </div>

                                    <span className="text-gray-500 text-xs font-bold">VS</span>

                                    <div className="flex items-center gap-3 w-[45%]">
                                        <img src={match.awayLogo} className="w-6 h-6 object-contain" />
                                        <span className="font-bold text-sm leading-tight">{match.awayTeam}</span>
                                    </div>
                                </div>

                                {/* Liga */}
                                <div className="hidden md:flex flex-col items-end w-24 text-right">
                                    <img src={match.leagueLogo} className="w-4 h-4 mb-1 object-contain opacity-50" />
                                    <span className="text-[9px] text-gray-500 truncate w-full">{match.leagueName}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSaveSelected}
                        disabled={selectedIds.size === 0 || status === "saving"}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-lg py-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                        {status === "saving" ? "SALVANDO..." : `CONFIRMAR ${selectedIds.size} JOGOS ➜`}
                    </button>
                </div>
            )}

            {status === "success" && (
                <div className="mt-4 p-4 bg-green-500/20 text-green-400 rounded text-center font-bold animate-in zoom-in">
                    Jogos adicionados com sucesso! A lista abaixo foi atualizada.
                </div>
            )}
        </div>
    )
}