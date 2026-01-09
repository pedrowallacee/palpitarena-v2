import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MatchCard } from "@/components/match-card"
import { MatchSelector } from "@/components/match-selector"
import { updateRoundResults } from "@/actions/update-results-action"

export default async function RoundDetailsPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const { slug, id } = await params

    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) redirect("/login")

    // Busca Rodada + Jogos + Palpites
    const round = await prisma.round.findUnique({
        where: { id },
        include: {
            championship: true,
            matches: {
                orderBy: { date: 'asc' },
                include: { predictions: { where: { userId: userId } } }
            }
        }
    })

    if (!round) return <div>Rodada não encontrada</div>

    // Busca Ranking da Rodada (Quem fez mais pontos nestes jogos)
    // Agrupamento manual simples pois Prisma groupBy pode ser chato em server components
    const allPredictions = await prisma.prediction.findMany({
        where: { match: { roundId: id }, isProcessed: true },
        include: { user: true }
    })

    // Agrupa pontos por usuário
    const rankingMap = new Map()
    allPredictions.forEach(p => {
        const current = rankingMap.get(p.userId) || { name: p.user.name, points: 0, avatar: p.user.name?.charAt(0) }
        current.points += (p.pointsEarned || 0)
        rankingMap.set(p.userId, current)
    })
    const ranking = Array.from(rankingMap.values()).sort((a, b) => b.points - a.points)

    const defaultDate = round.deadline.toISOString().split('T')[0];
    const isExpired = new Date() > round.deadline;
    const isOwner = round.championship.ownerId === userId;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6">
            <div className="max-w-4xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href={`/campeonatos/${slug}`} className="text-gray-400 hover:text-white text-sm">
                            ⬅ Voltar para {round.championship.name}
                        </Link>
                        <h1 className="text-3xl font-black italic mt-2">{round.name}</h1>
                        <p className={`${isExpired ? 'text-red-400' : 'text-emerald-400'} text-sm font-bold`}>
                            {isExpired ? '🔒 Prazo Encerrado' : `⏳ Prazo: ${round.deadline.toLocaleDateString()}`}
                        </p>
                    </div>

                    {/* BOTÃO DO JUIZ (ADMIN) */}
                    {isOwner && (
                        <form action={async () => {
                            'use server'
                            await updateRoundResults(id, slug)
                        }}>
                            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                                🔄 ATUALIZAR PLACARES
                            </button>
                        </form>
                    )}
                </div>

                {/* ADMIN: SELETOR DE JOGOS */}
                {isOwner && <MatchSelector roundId={round.id} slug={slug} defaultDate={defaultDate} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLUNA ESQUERDA: JOGOS */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold border-l-4 border-emerald-500 pl-3 mb-4">Seus Palpites</h2>
                        <div className="grid gap-3">
                            {round.matches.map(match => (
                                <div key={match.id} className="relative">
                                    <MatchCard
                                        match={match}
                                        prediction={match.predictions[0] || null}
                                        slug={slug}
                                        roundId={round.id}
                                    />
                                    {/* Mostra pontos se o jogo acabou */}
                                    {match.status === 'FINISHED' && match.predictions[0] && (
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded">
                                            +{match.predictions[0].pointsEarned} PTS
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUNA DIREITA: RANKING DA RODADA */}
                    <div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                🏆 Classificação
                            </h3>
                            {ranking.length === 0 ? (
                                <p className="text-sm text-gray-500">Nenhum ponto calculado ainda.</p>
                            ) : (
                                <div className="space-y-3">
                                    {ranking.map((player, index) => (
                                        <div key={index} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black w-4 ${index === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{index + 1}º</span>
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                                                    {player.avatar}
                                                </div>
                                                <span className="text-sm font-bold truncate max-w-[100px]">{player.name}</span>
                                            </div>
                                            <span className="font-black text-emerald-400">{player.points} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}