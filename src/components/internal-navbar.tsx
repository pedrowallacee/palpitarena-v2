import { cookies } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export async function InternalNavbar() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return null

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return null

    return (
        <nav className="sticky top-0 z-50 w-full bg-[#1a1a1a] border-b border-white/10 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo / Home */}
                <Link href="/dashboard" className="flex items-center gap-1 group">
                    <span className="text-xl font-black italic text-white font-teko group-hover:opacity-80 transition-opacity">
                        PALPITA<span className="text-emerald-500">RENA</span>
                    </span>
                </Link>

                {/* Menu Lado Direito */}
                <div className="flex items-center gap-4">

                    {/* Botão Admin (Só aparece se for Admin) */}
                    {user.role === 'ADMIN' && (
                        <Link href="/admin/solicitacoes" className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded font-bold uppercase hover:bg-red-500/20 transition-colors">
                            Área Admin
                        </Link>
                    )}

                    <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

                    {/* Dados do Usuário + Logout */}
                    <div className="flex items-center gap-3">
                        <span className="hidden md:block text-sm font-bold text-gray-300">
                            {user.name.split(' ')[0]}
                        </span>

                        <form action={async () => {
                            'use server'
                            const { logoutUser } = await import("@/actions/auth-actions")
                            await logoutUser()
                        }}>
                            <button className="text-xs text-gray-500 hover:text-white font-bold uppercase transition-colors border border-white/10 px-3 py-1 rounded hover:bg-white/5">
                                Sair
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>
    )
}