'use client'

import { useState } from "react"
import { saveHistoricalResultAction } from "@/actions/admin-history-action"
import { Loader2, Save } from "lucide-react"

export function AdminHistoryForm({ competition, saved, users }: any) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        // Adiciona dados ocultos necessários
        formData.append("season", "season2")
        formData.append("leagueName", competition.name)
        formData.append("category", competition.category)

        const res = await saveHistoricalResultAction(formData)
        if (!res.success) alert("Erro ao salvar")
        setLoading(false)
    }

    return (
        <form action={handleSubmit} className="space-y-3">
            {/* CAMPEÃO */}
            <div>
                <label className="text-[10px] font-bold text-yellow-500 uppercase flex justify-between">
                    🥇 Campeão
                    <span className="text-gray-600">+{800} pts</span> {/* Isso é visual, o valor real vem da config */}
                </label>
                <select
                    name="championId"
                    defaultValue={saved?.championId || ""}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-yellow-500 outline-none"
                >
                    <option value="">-- Selecione --</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>

            {/* VICE */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">🥈 Vice</label>
                <select
                    name="runnerUpId"
                    defaultValue={saved?.runnerUpId || ""}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-gray-400 outline-none"
                >
                    <option value="">-- Selecione --</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>

            {/* TERCEIRO */}
            <div>
                <label className="text-[10px] font-bold text-orange-700 uppercase">🥉 3º Lugar</label>
                <select
                    name="thirdPlaceId"
                    defaultValue={saved?.thirdPlaceId || ""}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-orange-700 outline-none"
                >
                    <option value="">-- Selecione --</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>

            <button
                disabled={loading}
                className="w-full bg-white/5 hover:bg-emerald-500 hover:text-black text-gray-400 text-xs font-bold py-2 rounded transition-all flex items-center justify-center gap-2 mt-2"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                SALVAR RESULTADO
            </button>
        </form>
    )
}