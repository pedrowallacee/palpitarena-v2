import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { JoinCodeInput } from "@/components/join-code-input"

export default async function DashboardPage() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            participations: { include: { championship: true } },
            ownedChampionships: true
        }
    })

    if (!user) redirect("/login")

    const allLeagues = [
        ...user.participations.map(p => p.championship),
        ...user.ownedChampionships
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500 selection:text-black pb-20">

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <nav className="relative z-20 max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
                <Link href="/" className="text-2xl font-black italic font-teko tracking-tighter hover:opacity-80 transition-opacity">
                    PALPITA<span className="text-emerald-500">RENA</span>
                </Link>

                <form action={async () => {
                    'use server'
                    const { cookies } = await import("next/headers")
                    const cookieStore = await cookies()
                    cookieStore.delete("palpita_session")
                    redirect("/login")
                }}>
                    <button className="text-xs font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg hover:border-red-500/30 hover:bg-red-500/10">
                        Sair do Campo
                    </button>
                </form>
            </nav>

            <main className="relative z-10 max-w-3xl mx-auto px-6 space-y-8 mt-4">

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#151515] to-[#0a0a0a] border border-white/10 shadow-2xl p-6 md:p-8 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-white/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center text-2xl md:text-3xl font-black text-white font-teko uppercase">
                                {user.name.charAt(0)}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Área Técnica</h2>
                            <h1 className="text-3xl md:text-4xl font-black italic font-teko uppercase text-white leading-none">
                                Olá, {user.name}
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Você está ativo em <strong className="text-white">{allLeagues.length}</strong> competições.
                            </p>
                        </div>

                        <Link
                            href="/criar-campeonato"
                            className="w-full md:w-auto px-6 py-3 bg-white text-black font-black uppercase text-sm rounded-lg hover:bg-gray-200 transition-colors shadow-lg text-center"
                        >
                            + Criar Liga
                        </Link>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                        </div>
                        <h3 className="text-xl font-bold font-teko uppercase text-white tracking-wide">
                            Código de Convite
                        </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Recebeu um código de um amigo? Digite abaixo para entrar no vestiário.
                    </p>

                    <div className="max-w-md">
                        <JoinCodeInput />
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-black italic font-teko uppercase text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                        Meus Campeonatos
                    </h3>

                    {allLeagues.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center bg-white/[0.02]">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                ⚽
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Nenhuma liga encontrada</h4>
                            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                                Você ainda não está competindo. Crie sua própria liga ou peça o código para um amigo.
                            </p>
                            {/* --- CORREÇÃO AQUI: Link apontava para /cadastro, agora vai para /criar-campeonato --- */}
                            <Link href="/criar-campeonato" className="text-emerald-500 font-bold text-sm hover:underline hover:text-emerald-400 transition-colors">
                                Criar nova liga agora
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allLeagues.map(league => (
                                <Link key={league.id} href={`/campeonatos/${league.slug}`}>
                                    <div className="bg-[#121212] hover:bg-[#1a1a1a] border border-white/10 hover:border-emerald-500/50 p-5 rounded-xl transition-all group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-lg">
                                                🏆
                                            </div>
                                            {league.ownerId === userId && (
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                    Dono
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-xl font-bold font-teko uppercase text-white group-hover:text-emerald-400 transition-colors truncate">
                                            {league.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">
                                            {league.format === 'POINTS' ? 'Pontos Corridos' : 'Mata-Mata'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}