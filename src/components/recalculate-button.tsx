'use client'

import { useState } from "react"
import { RefreshCw } from "lucide-react"
// CORREÇÃO: O import deve apontar para o arquivo da RODADA que alteramos agora
import { updateRoundResultsAction } from "@/actions/update-results-action"

interface RecalculateButtonProps {
    roundId: string
    slug: string
}

export function RecalculateButton({ roundId, slug }: RecalculateButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleRecalculate() {
        const message =
            `Tem certeza que deseja recalcular a rodada?

As novas regras serão aplicadas:
🏆 Super Placar (5+ gols cravados): 6 pts
🤝 Empate Exato (Ex: 2x2): 4 pts
🎯 Placar Exato Comum: 3 pts
😐 Empate (Errou placar): 2 pts
✅ Vitória (Errou placar): 1 pt`

        if (!confirm(message)) return

        setLoading(true)
        try {
            const res = await updateRoundResultsAction(roundId, slug)
            if (res.success) {
                alert("✅ Sucesso! Pontos recalculados.")
                // Opcional: Recarregar a página para ver as mudanças na hora
                window.location.reload()
            } else {
                alert("❌ Erro: " + res.message)
            }
        } catch (error) {
            console.error(error)
            alert("Erro ao conectar com o servidor.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleRecalculate}
            disabled={loading}
            className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-lg transition-all font-bold uppercase text-xs disabled:opacity-50"
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Processando..." : "Recalcular Pontos"}
        </button>
    )
}