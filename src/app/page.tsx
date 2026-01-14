import { Navbar } from "@/components/landing/navbar"
import { HeroFooter } from "@/components/landing/hero-footer"
import Link from "next/link"
import { cookies } from "next/headers" // Importante para checar login

export default async function Home() {
    // 1. Verificar se o usuário já está logado
    const cookieStore = await cookies()
    const isLoggedIn = !!cookieStore.get("palpita_session")?.value

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">

            {/* Navbar (Topo) */}
            <Navbar />

            {/* Hero Section (Meio) */}
            <main className="flex-1 relative flex flex-col justify-center items-center text-center px-4 overflow-hidden">

                {/* Imagem de Fundo */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                    style={{ backgroundImage: "url('https://wallpapers.com/images/hd/720p-sports-background-1275-x-704-x8qi0yyjkcubnw5s.jpg')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#050505]" />
                </div>

                {/* Conteúdo */}
                <div className="relative z-10 max-w-5xl mx-auto mt-20 md:mt-0 animate-in zoom-in duration-700">

                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md">
            <span className="text-[10px] md:text-xs font-bold text-emerald-400 uppercase tracking-widest">
              ● 2ª Temporada Disponível
            </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic text-white leading-[0.9] tracking-tighter mb-6 font-teko drop-shadow-2xl">
                        O JOGO FICA <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">
              SÉRIO AQUI.
            </span>
                    </h1>

                    <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium drop-shadow-md">
                        Escudos, artilharia, rankings e a glória de um título.<br className="hidden md:block"/>
                        Palpites entre amigos com pontuação automática em tempo real.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
                        {/* BOTÃO 1: CRIAR */}
                        <Link
                            href={isLoggedIn ? "/criar-campeonato" : "/cadastro"} // Se logado -> cria, Senão -> cadastra
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded-xl transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.4)] uppercase tracking-wide flex items-center justify-center gap-2"
                        >
                            CRIAR CAMPEONATO 🏆
                        </Link>

                        {/* BOTÃO 2: ENTRAR */}
                        <Link
                            href={isLoggedIn ? "/dashboard" : "/login"} // Se logado -> dashboard, Senão -> login
                            className="w-full md:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-2 backdrop-blur-sm"
                        >
                            {isLoggedIn ? "IR PARA O PAINEL ➜" : "ENTRAR NA LIGA ➜"}
                        </Link>
                    </div>
                </div>

                {/* Footer (Barra de Ligas) */}
                <div className="absolute bottom-0 w-full z-20">
                    <HeroFooter />
                </div>

            </main>
        </div>
    )
}