'use client'

import { loginUser } from "@/actions/auth-actions"
import Link from "next/link"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl")

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = (await loginUser(formData)) as { success: boolean, message: string }
        setLoading(false)

        if (result?.success) {
            router.push(callbackUrl || "/dashboard")
            router.refresh()
        } else {
            alert("❌ " + (result?.message || "Erro ao entrar"))
        }
    }

    return (
        // CARD DE LOGIN: Efeito vidro (glassmorphism) para destacar sobre o fundo
        <div className="w-full max-w-md mx-auto p-8 relative z-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
            <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6 text-2xl font-black italic font-teko text-white tracking-tighter hover:opacity-80 transition-opacity">
                    PALPITA<span className="text-emerald-500">RENA</span>
                </Link>

                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-2 leading-tight drop-shadow-lg">
                    De Volta ao <br />
                    {/* GRADIENTE DOURADO: Combina com a taça */}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-400 pr-2 py-1">
                        Campo
                    </span>
                </h1>
                <p className="text-gray-400 text-sm font-medium">Acesse sua prancheta tática.</p>
            </div>

            <form action={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative group">
                        {/* Inputs mais escuros e integrados */}
                        <input
                            name="email"
                            type="email"
                            placeholder="ex: guardiola@city.com"
                            className="w-full bg-[#0a0a0a]/80 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-700 focus:border-emerald-500/50 focus:bg-black/90 outline-none transition-all group-hover:border-white/20"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Senha</label>
                    </div>
                    <div className="relative group">
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••"
                            className="w-full bg-[#0a0a0a]/80 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-700 focus:border-emerald-500/50 focus:bg-black/90 outline-none transition-all group-hover:border-white/20"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide flex items-center justify-center gap-2 mt-6 border border-emerald-500/20"
                >
                    {loading ? (
                        <span className="animate-pulse">Entrando...</span>
                    ) : (
                        <>ACESSAR PAINEL <span className="text-xl">➜</span></>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Não tem contrato assinado? <br/>
                    <Link href={`/cadastro?callbackUrl=${encodeURIComponent(callbackUrl || "")}`} className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors mt-2 inline-block border-b border-transparent hover:border-emerald-400">
                        Criar conta agora
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex bg-[#050505]">
            {/* LADO ESQUERDO: IMAGEM DA TAÇA (Só Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">

                {/* --- AQUI ESTÁ A SUA IMAGEM --- */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-[30s] hover:scale-105"
                    style={{ backgroundImage: "url('https://lncimg.lance.com.br/uploads/2025/12/Copa-do-Mundo-2026-Trofeu-aspect-ratio-512-320.png')" }}
                />

                {/* Gradientes para integrar a imagem com o fundo preto nas bordas */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050505]" />

                <div className="relative z-10 p-12 flex flex-col justify-end h-full text-white pb-24 pl-16">
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 w-fit backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Rodada Aberta</span>
                    </div>

                    <h2 className="text-6xl font-black font-teko uppercase leading-[0.9] mb-6 drop-shadow-2xl">
                        Sua estratégia <br/>
                        define o <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400">Campeão</span>.
                    </h2>

                    <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-transparent rounded-full mb-6"></div>

                    <p className="text-gray-300 max-w-md font-medium text-lg leading-relaxed drop-shadow-md text-balance">
                        Analise os jogos, ajuste seus palpites e acompanhe sua subida no ranking em tempo real.
                    </p>
                </div>
            </div>

            {/* LADO DIREITO: FORMULÁRIO COM FUNDO INTEGRADO */}
            <div className="w-full lg:w-1/2 flex items-center justify-center relative bg-[#050505] overflow-hidden">

                {/* Luz de fundo (Spotlight) para dar profundidade atrás do card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Textura sutil de fibra de carbono */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

                <Suspense fallback={<div className="text-emerald-500 font-bold animate-pulse text-sm tracking-widest uppercase">Carregando campo...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}