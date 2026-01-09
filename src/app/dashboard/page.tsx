import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function Dashboard() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // Busca usuário e campeonatos
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            participations: {
                include: {
                    championship: true
                }
            },
            ownedChampionships: true
        }
    })

    if (!user) redirect("/login")

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
                <div>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Painel de Controle</span>
                    <h1 className="text-2xl font-bold font-['Teko'] italic">OLÁ, <span className="text-[#a3e635]">{user.name.toUpperCase()}</span></h1>
                </div>
                <form action="/api/auth/logout" method="POST">
                    <button className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1 rounded hover:bg-red-500/10 transition-colors">
                        SAIR
                    </button>
                </form>
            </header>

            <main className="max-w-6xl mx-auto space-y-8">

                {/* Meus Campeonatos (Onde sou dono) */}
                <section>
                    <div className="flex justify-between items-center mb-4 border-l-4 border-[#a3e635] pl-3">
                        <h2 className="text-xl font-bold">Meus Campeonatos</h2>
                        <Link href="/criar-campeonato" className="bg-[#00cc99] hover:bg-[#00b386] text-black text-xs font-bold px-3 py-2 rounded transition-colors">
                            + NOVO CAMPEONATO
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.ownedChampionships.map(camp => (
                            <div key={camp.id} className="bg-[#151515] border border-white/10 p-5 rounded-xl hover:border-white/30 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-2xl">🏆</span>
                                    {/* CORREÇÃO: Usando status em vez de active */}
                                    {camp.status !== 'FINISHED' ? (
                                        <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Ativo</span>
                                    ) : (
                                        <span className="bg-gray-700 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Encerrado</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg mb-1">{camp.name}</h3>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{camp.description || "Sem descrição"}</p>

                                <Link href={`/campeonatos/${camp.slug}`} className="block w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded text-sm font-bold text-gray-300 hover:text-white transition-colors">
                                    GERENCIAR
                                </Link>
                            </div>
                        ))}

                        {user.ownedChampionships.length === 0 && (
                            <p className="text-gray-500 text-sm col-span-full">Você ainda não criou nenhum campeonato.</p>
                        )}
                    </div>
                </section>

                {/* Campeonatos que participo */}
                <section>
                    <div className="mb-4 border-l-4 border-blue-500 pl-3">
                        <h2 className="text-xl font-bold">Minhas Ligas</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.participations.map(part => (
                            <Link key={part.id} href={`/campeonatos/${part.championship.slug}`}>
                                <div className="bg-[#151515] border border-white/10 p-4 rounded-xl hover:border-[#a3e635] transition-all cursor-pointer flex items-center gap-4">
                                    {part.teamLogo ? (
                                        <img src={part.teamLogo} className="w-12 h-12 object-contain" alt={part.teamName} />
                                    ) : (
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-xl">⚽</div>
                                    )}
                                    <div>
                                        <h4 className="font-bold text-white">{part.championship.name}</h4>
                                        <p className="text-xs text-gray-400">Jogando como: <span className="text-[#a3e635]">{part.teamName}</span></p>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {user.participations.length === 0 && (
                            <p className="text-gray-500 text-sm col-span-full">Você ainda não entrou em nenhuma liga.</p>
                        )}
                    </div>
                </section>

            </main>
        </div>
    )
}