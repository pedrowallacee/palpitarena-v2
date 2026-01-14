'use client'

import { deleteMatchAction } from "@/actions/delete-match-action"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function DeleteMatchButton({ matchId, roundPath }: { matchId: string, roundPath: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        if (!confirm("⚠️ Tem certeza que quer REMOVER este jogo da rodada?\n\nIsso apagará os palpites que a galera já fez para esse jogo específico.")) {
            return
        }

        setLoading(true)
        const res = await deleteMatchAction(matchId, roundPath)
        setLoading(false)

        if (!res.success) {
            alert(res.message)
        } else {
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500 border border-red-500/30 rounded-lg text-red-500 hover:text-white transition-all group"
            title="Remover jogo da rodada"
        >
            {loading ? (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <span className="text-lg leading-none mb-0.5">×</span>
            )}
        </button>
    )
}