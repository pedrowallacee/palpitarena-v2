'use client'

import { registerUser } from "@/actions/auth-actions"
import Link from "next/link"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function RegisterForm() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl")

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = (await registerUser(formData)) as { success: boolean, message: string }
        setLoading(false)

        if (result?.success) {
            router.push(callbackUrl || "/dashboard")
            router.refresh()
        } else {
            alert("❌ " + (result?.message || "Erro ao criar conta"))
        }
    }

    return (
        <div className="w-full max-w-md mx-auto p-6">
            <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6 text-2xl font-black italic font-teko text-white tracking-tighter hover:opacity-80 transition-opacity">
                    PALPITA<span className="text-emerald-500">RENA</span>
                </Link>

                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-2 leading-tight">
                    Assinar <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400 pr-2 py-1">
                        Contrato
                    </span>
                </h1>
                <p className="text-gray-400 text-sm mt-2">Crie sua conta e comece sua carreira de treinador.</p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome do Técnico</label>
                    <input
                        name="name"
                        type="text"
                        placeholder="Como você quer ser chamado?"
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none transition-all"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
                    <input
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none transition-all"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Senha</label>
                    <input
                        name="password"
                        type="password"
                        placeholder="Crie uma senha forte"
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none transition-all"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02] disabled:opacity-50 mt-2 uppercase tracking-wide"
                >
                    {loading ? "Processando..." : "FINALIZAR CADASTRO"}
                </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-sm text-gray-500">
                    Já tem conta? <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl || "")}`} className="text-emerald-400 font-bold hover:text-emerald-300 ml-1">Fazer Login</Link>
                </p>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen w-full flex bg-[#0f0f0f]">
            {/* LADO ESQUERDO: IMAGEM (Só Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                {/* Imagem: Vestiário / Preparação */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-[#0f0f0f]" />

                <div className="relative z-10 p-12 flex flex-col justify-end h-full text-white pb-20">
                    <h2 className="text-6xl font-black font-teko uppercase leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        Comece sua <br/> Jornada.
                    </h2>
                    <p className="text-gray-400 max-w-md font-medium text-lg border-l-4 border-emerald-500 pl-4">
                        "O talento vence jogos, mas só o trabalho em equipe e a inteligência vencem campeonatos."
                    </p>
                </div>
            </div>

            {/* LADO DIREITO: FORMULÁRIO */}
            <div className="w-full lg:w-1/2 flex items-center justify-center relative bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none" />

                <Suspense fallback={<div className="text-emerald-500 font-bold animate-pulse">Preparando contrato...</div>}>
                    <RegisterForm />
                </Suspense>
            </div>
        </div>
    )
}