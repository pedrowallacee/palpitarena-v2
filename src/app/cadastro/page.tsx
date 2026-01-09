'use client'

import { registerUser } from "@/actions/auth-actions"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CadastroPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        // CORREÇÃO: Os parênteses garantem que o 'await' resolva antes do 'as'
        const result = (await registerUser(formData)) as { success: boolean, message: string }

        setLoading(false)

        if (result?.success) {
            alert("✅ " + result.message)
            router.push("/login")
        } else {
            alert("❌ " + (result?.message || "Erro ao criar conta"))
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{
                    backgroundImage: "url('https://wallpapers.com/images/hd/720p-sports-background-1275-x-704-x8qi0yyjkcubnw5s.jpg')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-emerald-900/40" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8 m-4 animate-in zoom-in duration-500">

                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" />

                <div className="relative z-20">
                    <div className="text-center mb-8">
                        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                            Novo Treinador
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter">
                            CRIAR <span className="text-emerald-500">CONTA</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">Prepare-se para entrar em campo.</p>
                    </div>

                    <form action={handleSubmit} className="space-y-5">

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Nome do Técnico</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Como você quer ser chamado?"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Senha</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02] disabled:opacity-50"
                        >
                            {loading ? "CRIANDO..." : "ASSINAR CONTRATO ➜"}
                        </button>

                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-500">
                            Já está escalado? <Link href="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">Fazer Login</Link>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}