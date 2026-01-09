import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { logoutUser } from "@/actions/logout-action"
import Link from "next/link"

export default async function Dashboard() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 1. Buscamos o usuário E os campeonatos dele (ownedChampionships)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            ownedChampionships: {
                orderBy: { createdAt: 'desc' } // Os mais novos primeiro
            }
        }
    })

    return (
        <div className="relative min-h-screen text-white overflow-hidden">

            {/* Fundo do Estádio */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=3870&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <span className="text-xl font-black text-black">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Painel de Controle</p>
                            <h1 className="text-2xl font-black italic tracking-tight">
                                OLÁ, <span className="text-emerald-400">{user?.name?.toUpperCase()}</span>
                            </h1>
                        </div>
                    </div>

                    <form action={logoutUser}>
                        <button className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold rounded-full transition-all hover:scale-105">
                            SAIR
                        </button>
                    </form>
                </div>

                {/* ÁREA DE CAMPEONATOS */}
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-xl font-bold border-l-4 border-emerald-500 pl-3">Meus Campeonatos</h2>
                    <Link
                        href="/campeonatos/novo"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded transition-colors flex items-center gap-2"
                    >
                        + NOVO CAMPEONATO
                    </Link>
                </div>

                {/* 2. LISTAGEM INTELIGENTE */}
                {user?.ownedChampionships.length === 0 ? (

                    /* CASO 1: NÃO TEM NADA (Mostra o Card Gigante de Criar) */
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                        <div className="text-6xl mb-4">🏟️</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Sua arena está vazia</h3>
                        <p className="text-gray-400 mb-6">Você ainda não criou nenhum campeonato.</p>
                        <Link href="/campeonatos/novo" className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded transition-transform hover:scale-105">
                            CRIAR PRIMEIRO CAMPEONATO
                        </Link>
                    </div>

                ) : (

                    /* CASO 2: TEM CAMPEONATO (Mostra a Lista) */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {user?.ownedChampionships.map((camp) => (
                            <div key={camp.id} className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center text-lg">
                                        🏆
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${camp.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {camp.active ? 'Ativo' : 'Encerrado'}
                  </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 truncate">{camp.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-6 h-10">
                                    {camp.description || "Sem descrição definida."}
                                </p>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/campeonatos/${camp.slug}`}
                                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-center rounded text-sm font-bold transition-colors"
                                    >
                                        GERENCIAR
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                )}

            </div>
        </div>
    )
}