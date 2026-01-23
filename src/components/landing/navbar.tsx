import { cookies } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Trophy } from "lucide-react"

export async function Navbar() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    let user = null
    if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } })
    }

    return (
        <nav className="absolute top-0 w-full z-50 px-4 py-4 md:px-6 md:py-6 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
            {/* Logo (Corrigido: Removi flex/gap para as letras ficarem coladas) */}
            <Link href="/" className="text-2xl md:text-3xl font-black italic tracking-tighter text-white font-teko hover:opacity-80 transition-opacity">
                PALPIT<span className="text-emerald-500">ARENA</span>
            </Link>

            {/* Ações e Menu */}
            <div className="flex items-center gap-3 md:gap-6">

                {/* Link para o Histórico (Hall da Fama) */}
                <Link
                    href="/historico"
                    className="flex items-center gap-2 group transition-all"
                    title="Ver Histórico de Campeões"
                >
                    <div className="bg-yellow-500/10 p-2 rounded-full border border-yellow-500/20 group-hover:bg-yellow-500/20 group-hover:border-yellow-500/50 transition-all">
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                    </div>
                    <span className="hidden md:block text-xs md:text-sm font-bold text-gray-300 uppercase tracking-wider group-hover:text-white">
                        Sala de Troféus
                    </span>
                </Link>

                {/* Divisória visual (só no PC) */}
                <div className="hidden md:block w-px h-8 bg-white/10"></div>

                {/* Área do Usuário */}
                {user ? (
                    <div className="flex items-center gap-3">
                        <span className="hidden lg:block text-sm font-bold text-gray-300 font-sans">
                            Olá, {user.name.split(' ')[0]}
                        </span>

                        {/* Botão Só para Admin */}
                        {user.role === 'ADMIN' && (
                            <Link
                                href="/admin/solicitacoes"
                                className="px-3 py-1.5 md:px-5 md:py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-full text-red-400 text-xs md:text-sm font-bold transition-all backdrop-blur-md uppercase tracking-wide flex items-center gap-2"
                            >
                                🔒 Admin
                            </Link>
                        )}

                        <Link
                            href="/dashboard"
                            className="px-4 py-1.5 md:px-5 md:py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-xs md:text-sm font-bold transition-all backdrop-blur-md uppercase tracking-wide"
                        >
                            Painel
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link
                            href="/login"
                            className="text-white hover:text-emerald-400 font-bold text-xs md:text-sm transition-colors uppercase tracking-wide"
                        >
                            ENTRAR
                        </Link>
                        <Link
                            href="/cadastro"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs md:text-sm font-black rounded-full transition-transform hover:scale-105 shadow-lg shadow-emerald-500/20 uppercase tracking-wide"
                        >
                            CRIAR CONTA
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    )
}