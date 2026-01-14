import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { InviteButton } from "@/components/invite-button"
import { InternalNavbar } from "@/components/internal-navbar"
import { Leaderboard } from "@/components/leaderboard"

export default async function ChampionshipHub({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 1. BUSCAR O USUÁRIO LOGADO (Para saber se é ADMIN)
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true } // Pegamos o ID e a Role (ADMIN ou USER)
    })

    if (!currentUser) redirect("/login")

    // 2. BUSCAR O CAMPEONATO
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            owner: true,
            rounds: { orderBy: { createdAt: 'desc' } },
            participants: {
                orderBy: { points: 'desc' },
                include: { user: true }
            }
        }
    })

    if (!championship) return <div className="p-10 text-center text-white">Campeonato não encontrado.</div>

    // 3. LÓGICA DE PERMISSÃO (CORRIGIDA)
    // Você pode gerenciar se: For o Dono OU se for ADMIN Geral
    const isOwner = championship.ownerId === userId
    const isAdmin = currentUser.role === 'ADMIN'
    const canManage = isOwner || isAdmin

    const amIParticipating = championship.participants.some(p => p.userId === userId)

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-emerald-500 selection:text-black">
            <InternalNavbar />

            {/* --- HERO SECTION --- */}
            <div className="relative w-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 border-b border-white/5 overflow-hidden">

                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm"
                    style={{ backgroundImage: "url('https://img.freepik.com/fotos-premium/trofeu-de-ouro-e-faixas-em-fundo-azul-conceito-de-negocios-e-competicao_687463-8126.jpg?semt=ais_hybrid&w=740&q=80')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-[#050505]/60 to-[#050505]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                <div className="relative z-10 w-full max-w-4xl flex flex-col items-center animate-in zoom-in duration-500">

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md mb-6">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            {championship.participants.length} / {championship.maxParticipants} Treinadores
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black italic font-teko text-white uppercase leading-[0.85] mb-6 drop-shadow-2xl">
                        {championship.name}
                    </h1>

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 bg-white/5 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-2xl shadow-2xl">

                        <div className="flex flex-col items-center justify-center bg-[#0a0a0a] rounded-xl px-8 py-3 border border-white/5 relative group cursor-pointer overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Código de Acesso</span>
                            <span className="text-3xl font-black font-mono text-white tracking-widest group-hover:text-emerald-400 transition-colors select-all">
                                {championship.code}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            {!amIParticipating ? (
                                <Link
                                    href={`/campeonatos/${slug}/escolher-time`}
                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wide rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    ⚽ Entrar em Campo
                                </Link>
                            ) : (
                                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                    <span className="text-lg">✅</span>
                                    Inscrito
                                </div>
                            )}

                            <InviteButton slug={championship.slug} />

                            {/* SE FOR DONO OU ADMIN, MOSTRA O BOTÃO DE AJUSTES */}
                            {canManage && (
                                <Link href={`/campeonatos/${slug}/editar`} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all" title="Configurações da Liga">
                                    ⚙️
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 relative z-20 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA: RODADAS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black italic font-teko uppercase text-white flex items-center gap-2 drop-shadow-md">
                            <span className="text-emerald-500 text-3xl">📅</span> Rodadas & Jogos
                        </h2>

                        {/* BOTÃO DE CRIAR RODADA (Agora visível para ADMIN também) */}
                        {canManage && (
                            <Link
                                href={`/campeonatos/${slug}/nova-rodada`}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] px-4 py-2 rounded-lg uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2"
                            >
                                + Nova Rodada
                            </Link>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {championship.rounds.length === 0 ? (
                            // EMPTY STATE
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 border-dashed rounded-2xl p-12 text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-gray-600 group-hover:scale-110 transition-transform">
                                        🗓️
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma rodada definida</h3>
                                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                        {canManage
                                            ? 'Você precisa criar a primeira rodada para liberar os palpites.'
                                            : 'Aguarde o organizador liberar a tabela.'}
                                    </p>

                                    {/* BOTÃO NO EMPTY STATE TAMBÉM */}
                                    {canManage && (
                                        <Link href={`/campeonatos/${slug}/nova-rodada`} className="inline-block mt-6 px-6 py-3 bg-white/10 hover:bg-emerald-500 hover:text-black border border-white/10 hover:border-emerald-500 rounded-lg text-white font-bold text-xs uppercase tracking-widest transition-all">
                                            Criar Rodada #1 Agora
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // LISTA DE RODADAS
                            championship.rounds.map(round => {
                                const isOpen = round.status === 'OPEN'
                                return (
                                    <Link key={round.id} href={`/campeonatos/${slug}/rodada/${round.id}`}>
                                        <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500/50 p-5 rounded-2xl transition-all group relative overflow-hidden shadow-lg hover:shadow-emerald-900/10">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOpen ? 'bg-emerald-500' : 'bg-gray-600'}`} />

                                            <div className="flex justify-between items-center pl-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-2xl font-black font-teko uppercase text-white group-hover:text-emerald-400 transition-colors">
                                                            {round.name}
                                                        </h3>
                                                        {isOpen && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-2">
                                                        <span>⏰ Encerra: {new Date(round.deadline).toLocaleDateString()}</span>
                                                    </p>
                                                </div>

                                                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${
                                                    isOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                        'bg-gray-800/50 border-gray-700/50 text-gray-500'
                                                }`}>
                                                    {isOpen ? 'Aberto' : round.status}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* COLUNA DIREITA: CLASSIFICAÇÃO */}
                <div className="mb-10 lg:mb-0">
                    <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-2xl lg:sticky lg:top-24 shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <h2 className="text-2xl font-black italic font-teko uppercase text-white flex items-center gap-2">
                                🏆 Classificação
                            </h2>
                            <span className="text-[10px] bg-black/40 border border-white/10 px-2 py-1 rounded text-gray-300 uppercase font-bold tracking-wider">
                                {championship.format === 'KNOCKOUT' ? 'Mata-Mata' : championship.format === 'GROUPS' ? 'Grupos' : 'Pontos'}
                            </span>
                        </div>

                        {championship.participants.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-500 mb-2">Aguardando jogadores...</p>
                                <div className="w-8 h-1 bg-white/10 mx-auto rounded-full" />
                            </div>
                        ) : (
                            <Leaderboard participants={championship.participants} />
                        )}
                    </div>
                </div>

            </main>
        </div>
    )
}