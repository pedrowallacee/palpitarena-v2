'use client'

import { useState } from "react"
import { drawGroupsAction } from "@/actions/draw-groups"

export function StartDrawButton({ championshipId, playerCount, maxParticipants }: { championshipId: string, playerCount: number, maxParticipants: number }) {
    const [loading, setLoading] = useState(false)

    async function handleDraw() {
        if (!confirm("Tem certeza? Isso vai definir os grupos/chaves aleatoriamente.")) return

        setLoading(true)
        const res = await drawGroupsAction(championshipId)
        setLoading(false)
        alert(res.message)
    }

    // Só habilita se tiver pelo menos metade da sala cheia (segurança) ou forçar
    const isReady = playerCount >= 2

    return (
        <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-xl mb-8 flex flex-col items-center text-center animate-in zoom-in">
            <h3 className="text-xl font-black font-teko text-white uppercase mb-2">
                🏆 Sorteio Oficial
            </h3>

            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-400">
                <span>Vagas Preenchidas:</span>
                <span className={playerCount >= maxParticipants ? "text-emerald-400" : "text-yellow-400"}>
                    {playerCount}/{maxParticipants}
                </span>
            </div>

            <div className="w-full bg-gray-800 h-2 rounded-full mb-6 overflow-hidden max-w-xs">
                <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(playerCount / maxParticipants) * 100}%` }}
                />
            </div>

            <button
                onClick={handleDraw}
                disabled={loading || !isReady}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black px-8 py-3 rounded-lg uppercase tracking-wide shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
                {loading ? "Sorteando..." : "🎲 SORTEAR E INICIAR CAMPEONATO"}
            </button>

            {!isReady && <p className="text-[10px] text-gray-500 mt-2">Mínimo de 2 jogadores para iniciar.</p>}
        </div>
    )
}