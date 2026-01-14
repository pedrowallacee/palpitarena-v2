import { cookies } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export async function Navbar() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    let user = null
    if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } })
    }

    return (
        <nav className="absolute top-0 w-full z-50 px-4 py-4 md:px-6 md:py-6 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
            {/* Logo */}
            <Link href="/" className="text-2xl md:text-3xl font-black italic tracking-tighter text-white font-teko hover:opacity-80 transition-opacity">
                PALPITA<span className="text-emerald-500">RENA</span>
            </Link>

            {/* Ações */}
            <div className="flex items-center gap-3">
                {user ? (
                    <div className="flex items-center gap-3">
                        <span className="hidden md:block text-sm font-bold text-gray-300 font-sans">
                            Olá, {user.name.split(' ')[0]}
                        </span>

                        {/* --- NOVO: Botão Só para Admin --- */}
                        {user.role === 'ADMIN' && (
                            <Link
                                href="/admin/solicitacoes"
                                className="px-4 py-1.5 md:px-5 md:py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-full text-red-400 text-xs md:text-sm font-bold transition-all backdrop-blur-md uppercase tracking-wide flex items-center gap-2"
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
                    <>
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
                    </>
                )}
            </div>
        </nav>
    )
}