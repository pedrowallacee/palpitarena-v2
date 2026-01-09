import Link from "next/link"
import { loginUser } from "@/actions/login-action"

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* 1. MESMO FUNDO (Continuidade Visual) */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{
                    backgroundImage: "url('https://wallpapers.com/images/hd/720p-sports-background-1275-x-704-x8qi0yyjkcubnw5s.jpg')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-emerald-900/40" />
            </div>

            {/* 2. CARD DE LOGIN */}
            <div className="relative z-10 w-full max-w-md p-8 m-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Efeito Glass */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" />

                <div className="relative z-20">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                            Acesso Restrito
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter">
                            BEM-VINDO <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">
                DE VOLTA
              </span>
                        </h1>
                    </div>

                    <form action={loginUser} className="space-y-5">

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
                            <div className="flex justify-between ml-1">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Senha</label>
                                <Link href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Esqueceu?</Link>
                            </div>
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
                            className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02]"
                        >
                            ENTRAR EM CAMPO ➜
                        </button>

                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-500">
                            Ainda não tem time? <Link href="/cadastro" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">Criar Conta</Link>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}