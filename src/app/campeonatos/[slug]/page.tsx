import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { InternalNavbar } from "@/components/internal-navbar"
import { Leaderboard } from "@/components/leaderboard"
import { InviteButton } from "@/components/invite-button"
import { RoundListItem } from "@/components/round-list-item"

export default async function CampeonatoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 1. BUSCA O USUÁRIO ATUAL (Para checar se é ADMIN)
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
    })

    if (!currentUser) redirect("/login")

    // 2. BUSCA O CAMPEONATO
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            owner: true,
            // Busca Rodadas + Jogos + MEUS Palpites
            rounds: {
                orderBy: { createdAt: 'desc' }, // Rodadas mais novas primeiro
                include: {
                    matches: {
                        orderBy: { date: 'asc' },
                        include: {
                            predictions: {
                                where: { userId } // Traz só o palpite do usuário logado
                            }
                        }
                    }
                }
            },
            participants: {
                include: { user: true }
            }
        }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    // 3. DEFINE AS PERMISSÕES
    const myParticipant = championship.participants.find(p => p.userId === userId)
    const isOwner = championship.ownerId === userId
    const isAdmin = currentUser.role === 'ADMIN'

    // Define quem pode gerenciar (Criar/Deletar Rodadas)
    const canManage = isOwner || isAdmin

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-emerald-500 selection:text-black">
            <InternalNavbar />

            {/* HEADER DO CAMPEONATO */}
            <div className="relative bg-[#121212] border-b border-white/10 py-10 px-4 mb-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        {myParticipant && (
                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                    {myParticipant.points} Pts • {championship.participants.length} Treinadores
                                </span>
                            </div>
                        )}
                        <h1 className="text-4xl md:text-6xl font-black italic font-teko uppercase text-white leading-none mb-2">
                            {championship.name}
                        </h1>
                    </div>

                    {/* Caixa de Código e Convite */}
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col items-center gap-3 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Código de Acesso</p>
                            <p className="text-2xl font-mono font-black text-white tracking-widest">
                                {championship.code || "---"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {/* Botão de Configurações (Só para quem gerencia) */}
                            {canManage && (
                                <Link href={`/campeonatos/${slug}/editar`} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors" title="Configurações">
                                    ⚙️
                                </Link>
                            )}

                            {/* CORREÇÃO AQUI: Adicionado '?? ""' para garantir que não seja null */}
                            <InviteButton code={championship.code ?? ""} slug={slug} />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA DA ESQUERDA: RODADAS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black italic font-teko uppercase flex items-center gap-2">
                            <span className="text-white text-3xl">📅</span> Rodadas & Jogos
                        </h2>

                        {/* Botão Nova Rodada (Só aparece se tiver permissão) */}
                        {canManage && (
                            <Link
                                href={`/campeonatos/${slug}/nova-rodada`}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase px-4 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-105"
                            >
                                <span className="text-sm leading-none">+</span> Nova Rodada
                            </Link>
                        )}
                    </div>

                    <div className="space-y-3">
                        {championship.rounds.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <p className="text-gray-500 mb-4">Nenhuma rodada criada ainda.</p>
                                {canManage && (
                                    <Link
                                        href={`/campeonatos/${slug}/nova-rodada`}
                                        className="text-emerald-500 font-bold text-sm hover:underline"
                                    >
                                        Criar a primeira rodada agora
                                    </Link>
                                )}
                            </div>
                        ) : (
                            championship.rounds.map(round => (
                                <RoundListItem
                                    key={round.id}
                                    round={round}
                                    slug={slug}
                                    canManage={canManage} // Passa a permissão para o item (Ativa o Lixo)
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* COLUNA DA DIREITA: CLASSIFICAÇÃO */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black italic font-teko uppercase flex items-center gap-2">
                            <span className="text-yellow-500 text-3xl">🏆</span> Classificação
                        </h2>
                        <Link href="/ranking" className="text-[10px] font-bold text-gray-500 bg-white/5 hover:bg-white/10 px-3 py-1 rounded transition-colors uppercase">
                            Ver Geral
                        </Link>
                    </div>

                    <Leaderboard participants={championship.participants} />
                </div>

            </main>
        </div>
    )
}