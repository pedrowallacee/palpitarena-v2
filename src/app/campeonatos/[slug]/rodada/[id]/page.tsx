import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { InternalNavbar } from "@/components/internal-navbar"
import { PredictionsForm } from "@/components/predictions-form"
import { MatchSelector } from "@/components/match-selector"
import { DeleteMatchButton } from "@/components/delete-match-button"

export default async function RodadaPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
    const { slug, id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 1. Busca Usuário e Role
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
    })

    if (!currentUser) redirect("/login")

    // 2. Busca Rodada
    const round = await prisma.round.findUnique({
        where: { id },
        include: {
            matches: {
                orderBy: { date: 'asc' },
                include: {
                    predictions: { where: { userId } }
                }
            },
            championship: true
        }
    })

    if (!round) return <div className="p-10 text-center text-white">Rodada não encontrada</div>

    // 3. Permissões
    const isOwner = round.championship.ownerId === userId
    const isAdmin = currentUser.role === 'ADMIN'
    const canManage = isOwner || isAdmin
    const isClosed = new Date() > new Date(round.deadline) || round.status === 'FINISHED'

    // 4. Busca Minha Participação
    const myParticipation = await prisma.championshipParticipant.findFirst({
        where: { userId, championshipId: round.championship.id }
    })

    if (!myParticipation && !canManage) {
        return <div className="p-10 text-center text-white">Você não participa deste campeonato.</div>
    }

    // 5. Lógica do Duelo (Rival)
    let opponent = null
    if (myParticipation) {
        const myDuel = await prisma.duel.findFirst({
            where: {
                roundId: id,
                OR: [
                    { homeParticipantId: myParticipation.id },
                    { awayParticipantId: myParticipation.id }
                ]
            },
            include: {
                homeParticipant: { include: { user: true } },
                awayParticipant: { include: { user: true } }
            }
        })

        if (myDuel) {
            const isHome = myDuel.homeParticipantId === myParticipation.id
            const opponentPart = isHome ? myDuel.awayParticipant : myDuel.homeParticipant

            const opponentPredictions = await prisma.prediction.findMany({
                where: { userId: opponentPart.userId!, roundId: id }
            })

            opponent = {
                name: opponentPart.user?.name || "Sem Técnico",
                teamName: opponentPart.teamName,
                teamLogo: opponentPart.teamLogo,
                predictions: opponentPredictions
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-emerald-500 selection:text-black">
            <InternalNavbar />

            {/* HEADER DA RODADA */}
            <div className="bg-[#121212] border-b border-white/10 py-8 px-4 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <Link
                        href={`/campeonatos/${slug}`}
                        className="text-[10px] uppercase font-bold text-gray-400 hover:text-white mb-4 flex items-center gap-1 transition-colors w-fit group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Campeonato
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl md:text-5xl font-black italic font-teko uppercase text-white leading-none">
                                    {round.name}
                                </h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                                    isClosed
                                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse'
                                }`}>
                                    {isClosed ? 'Encerrado' : 'Aberto'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-lg">⏳</span>
                                <p className="text-sm font-bold uppercase tracking-wide">
                                    Prazo: <span className={isClosed ? 'text-red-400' : 'text-emerald-400'}>
                                        {new Date(round.deadline).toLocaleString('pt-BR')}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Card do Rival (Se houver duelo) */}
                        {opponent && (
                            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Seu Rival</p>
                                    <p className="text-sm font-bold text-white">{opponent.teamName}</p>
                                </div>
                                <div className="relative w-10 h-10">
                                    {opponent.teamLogo ? (
                                        <img src={opponent.teamLogo} className="w-full h-full rounded-full object-contain bg-white/5 border border-white/10 p-1" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-red-500/20 flex items-center justify-center text-xs font-black text-red-500 border border-red-500/30">
                                            VS
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4">

                {/* --- ÁREA DE GESTÃO (ADMIN/DONO) --- */}
                {canManage && (
                    <div className="mb-12 animate-in slide-in-from-top-4 duration-700 space-y-8">

                        {/* Seletor de Jogos */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Painel do Organizador</span>
                            </div>
                            <MatchSelector roundId={round.id} championshipSlug={slug} />
                        </div>

                        {/* Lista de Jogos Confirmados (Admin vê botão de excluir) */}
                        {round.matches.length > 0 && (
                            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />

                                <h3 className="text-lg font-black italic font-teko uppercase text-white mb-4 flex items-center gap-2">
                                    <span className="text-white">📋</span> Jogos Confirmados ({round.matches.length})
                                </h3>

                                <div className="grid gap-2">
                                    {round.matches.map(match => (
                                        <div key={match.id} className="flex flex-col md:flex-row md:items-center justify-between bg-[#1a1a1a] p-3 rounded-lg border border-white/5 gap-3 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-start">
                                                <span className="text-emerald-500 font-mono text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                    {new Date(match.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-300">{match.homeTeam}</span>
                                                    <span className="text-xs text-gray-600 font-black">X</span>
                                                    <span className="font-bold text-gray-300">{match.awayTeam}</span>
                                                </div>
                                            </div>
                                            {/* Botão de Excluir */}
                                            <div className="self-end md:self-auto">
                                                <DeleteMatchButton matchId={match.id} roundPath={`/campeonatos/${slug}/rodada/${id}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Divisória */}
                {canManage && <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />}

                {/* --- ÁREA DE PALPITES (PARA TODOS) --- */}
                <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-black italic font-teko uppercase text-white flex items-center gap-2">
                            <span className="text-emerald-500">⚽</span> Seus Palpites
                        </h2>
                    </div>

                    {round.matches.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl text-gray-500">
                                💤
                            </div>
                            <p className="text-gray-500 font-medium">Nenhum jogo definido para esta rodada ainda.</p>
                            {canManage && <p className="text-emerald-500 text-xs font-bold mt-2 animate-pulse uppercase tracking-wide">Use o painel acima para adicionar jogos!</p>}
                        </div>
                    ) : (
                        <PredictionsForm
                            round={round}
                            userId={userId}
                            isClosed={isClosed}
                            isAdmin={canManage}
                            slug={slug}
                            opponent={opponent}
                        />
                    )}
                </div>

            </main>
        </div>
    )
}