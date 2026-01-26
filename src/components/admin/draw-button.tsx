'use client'

import { useState } from "react"
import { Dices, Loader2 } from "lucide-react"
import { drawGroupsAction } from "@/actions/draw-groups-action"
import { useRouter } from "next/navigation"

export function DrawButton({ championshipId }: { championshipId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDraw() {
        if (!confirm("⚠️ ATENÇÃO: Isso vai resetar a Fase de Grupos e sortear tudo de novo aleatoriamente. Continuar?")) return

        setLoading(true)
        const res = await drawGroupsAction(championshipId)
        setLoading(false)

        if (res.success) {
            alert(res.message)
            router.refresh()
        } else {
            alert("Erro: " + res.message)
        }
    }

    return (
        <button
            onClick={handleDraw}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase px-6 py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-white/10"
        >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Dices className="w-6 h-6" />}
            <div className="text-left leading-none">
                <div className="text-sm">Realizar Sorteio</div>
                <div className="text-[10px] opacity-70 font-normal">Padrão FIFA (Grupos de 4)</div>
            </div>
        </button>
    )
}