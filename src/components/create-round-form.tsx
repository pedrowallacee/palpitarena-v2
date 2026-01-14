'use client'

import { useState } from "react"
import { createRoundAction } from "@/actions/round-actions" // Verifique se essa action existe ou crie (código abaixo)
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CreateRoundFormProps {
    championshipSlug: string
    championshipId: string
}

export function CreateRoundForm({ championshipSlug, championshipId }: CreateRoundFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        // Adiciona o ID do campeonato ao formulário
        formData.append("championshipId", championshipId)

        const result = await createRoundAction(formData)

        if (result?.success) {
            alert("✅ Rodada criada com sucesso!")
            router.push(`/campeonatos/${championshipSlug}`)
            router.refresh()
        } else {
            alert("❌ " + (result?.message || "Erro ao criar rodada"))
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* LUZ DE FUNDO */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            {/* HEADER DE VOLTAR */}
            <div className="w-full max-w-2xl mb-8 relative z-10">
                <Link href={`/campeonatos/${championshipSlug}`} className="text-gray-400 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest flex items-center gap-2 group w-fit">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar para a Liga
                </Link>
            </div>

            {/* CARD DO FORMULÁRIO */}
            <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 backdrop-blur-sm">

                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black italic font-teko uppercase text-white leading-none">
                        Abrir Nova <span className="text-emerald-500">Rodada</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">
                        Defina o prazo para os palpites.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-6">

                    {/* 1. NOME DA RODADA */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome da Rodada</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="Ex: Rodada #01 - Abertura"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg font-bold placeholder:text-gray-700 focus:border-emerald-500 focus:bg-black/60 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* 2. DATA LIMITE (DEADLINE) */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Prazo para Palpites (Deadline)</label>
                        <div className="relative">
                            <input
                                name="deadline"
                                type="datetime-local"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm font-bold focus:border-emerald-500 focus:bg-black/60 outline-none transition-all [color-scheme:dark]"
                                required
                            />
                        </div>
                        <p className="text-[10px] text-gray-600 ml-1">
                            * Os palpites serão bloqueados automaticamente após este horário.
                        </p>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.01] disabled:opacity-50 uppercase tracking-wide flex items-center justify-center gap-2"
                        >
                            {loading ? "Criando..." : "CRIAR RODADA ➜"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}