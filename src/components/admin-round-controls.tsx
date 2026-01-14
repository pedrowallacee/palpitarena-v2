'use client'

import { useState } from "react"
import { deleteRoundAction, removeMatchAction } from "@/actions/admin-round-actions"
import { useRouter } from "next/navigation"

interface AdminRoundControlsProps {
    roundId: string
    slug: string
    matches: any[]
}

export function AdminRoundControls({ roundId, slug, matches }: AdminRoundControlsProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDeleteRound() {
        if (!confirm("TEM CERTEZA? Isso vai apagar a rodada e TODOS os palpites dela. Não tem volta.")) return

        setLoading(true)
        const res = await deleteRoundAction(roundId, slug)

        if (res.success) {
            alert("🗑️ Rodada excluída!")
            router.push(`/campeonatos/${slug}`)
        } else {
            alert(res.message)
            setLoading(false)
        }
    }

    async function handleRemoveMatch(matchId: string) {
        if (!confirm("Remover este jogo da rodada?")) return

        const res = await removeMatchAction(matchId, roundId, slug)
        if (!res.success) alert(res.message)
    }

    return (
        <div className="mb-8 border border-red-500/20 bg-red-500/5 rounded-xl p-4 animate-in fade-in">
            <h3 className="text-red-500 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                ⚙️ Zona de Perigo (Admin)
            </h3>

            <div className="flex flex-col gap-4">
                {/* LISTA DE JOGOS PARA REMOVER INDIVIDUALMENTE */}
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Gerenciar Jogos</p>
                    {matches.map(match => (
                        <div key={match.id} className="flex justify-between items-center bg-[#1a1a1a] p-2 rounded border border-white/5">
                            <span className="text-xs text-gray-300">
                                {match.homeTeam} x {match.awayTeam}
                            </span>
                            <button
                                onClick={() => handleRemoveMatch(match.id)}
                                className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                            >
                                Remover
                            </button>
                        </div>
                    ))}
                    {matches.length === 0 && <p className="text-xs text-gray-600 italic">Sem jogos nesta rodada.</p>}
                </div>

                <div className="h-px bg-red-500/20 my-2" />

                {/* BOTÃO DELETAR RODADA */}
                <button
                    onClick={handleDeleteRound}
                    disabled={loading}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 p-3 rounded font-bold uppercase text-xs transition-all flex items-center justify-center gap-2"
                >
                    {loading ? "Excluindo..." : "🗑️ EXCLUIR ESTA RODADA"}
                </button>
            </div>
        </div>
    )
}