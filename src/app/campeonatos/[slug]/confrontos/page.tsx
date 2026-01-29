import { prisma } from "@/lib/prisma"
import { InternalNavbar } from "@/components/internal-navbar"
import Link from "next/link"
import { ArrowLeft, Swords, Trophy } from "lucide-react"

export default async function ConfrontosPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            rounds: {
                where: { type: 'GROUP_STAGE' },
                orderBy: { createdAt: 'asc' }, // <--- MUDANÇA AQUI: 'asc' para mostrar Rodada 1, 2, 3...
                include: {
                    duels: {
                        include: {
                            homeParticipant: { include: { user: true } },
                            awayParticipant: { include: { user: true } }
                        }
                    }
                }
            }
        }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 font-sans pb-20">
            <InternalNavbar />

            <div className="max-w-5xl mx-auto px-4 mt-8">
                {/* CABEÇALHO */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/campeonatos/${slug}`} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 group">
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none text-white flex items-center gap-2 font-teko">
                            Resultados dos Confrontos
                        </h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <Swords className="w-3 h-3 text-emerald-500" />
                            Histórico de Duelos X1
                        </p>
                    </div>
                </div>

                {/* LISTA DE RODADAS */}
                <div className="space-y-12">
                    {championship.rounds.map((round) => (
                        <div key={round.id} className="animate-in slide-in-from-bottom-4 duration-500">

                            {/* TÍTULO DA RODADA */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <h2 className="text-xl font-black uppercase tracking-wide text-white font-teko">
                                    {round.name}
                                </h2>
                                <span className="text-[10px] font-bold text-gray-600 border border-white/10 px-2 py-1 rounded bg-black/20">
                                    {round.duels.length} Jogos
                                </span>
                            </div>

                            {/* GRID DE DUELOS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {round.duels.map((duel) => {
                                    // Lógica de Vencedor
                                    const homeScore = duel.homeScore || 0
                                    const awayScore = duel.awayScore || 0
                                    const isFinished = duel.status === 'FINISHED'

                                    const homeWin = isFinished && homeScore > awayScore
                                    const awayWin = isFinished && awayScore > homeScore
                                    const isDraw = isFinished && homeScore === awayScore

                                    return (
                                        <div key={duel.id} className="relative bg-[#121212] border border-white/5 rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-900/10">

                                            {/* TEXTURA DE FUNDO (Sutil) */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="relative p-5 flex items-center justify-between gap-2">

                                                {/* --- MANDANTE (ESQUERDA) --- */}
                                                <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                                                    <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center p-2 border-2 transition-all ${homeWin ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#1a1a1a] border-white/5 grayscale-[0.5] opacity-80'}`}>
                                                        {duel.homeParticipant.teamLogo ? (
                                                            <img src={duel.homeParticipant.teamLogo} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-sm font-black">{duel.homeParticipant.teamName.charAt(0)}</span>
                                                        )}
                                                        {homeWin && <div className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1 rounded-full"><Trophy className="w-3 h-3" /></div>}
                                                    </div>
                                                    <div className="w-full">
                                                        <h3 className={`text-sm md:text-base font-black uppercase truncate leading-none ${homeWin ? 'text-white' : 'text-gray-500'}`}>
                                                            {duel.homeParticipant.teamName}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-gray-600 uppercase truncate mt-0.5">
                                                            {duel.homeParticipant.user?.name}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* --- PLACAR CENTRAL --- */}
                                                <div className="flex flex-col items-center justify-center min-w-[80px] z-10">
                                                    {isFinished ? (
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-4xl md:text-5xl font-black font-teko leading-none ${homeWin ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : isDraw ? 'text-white' : 'text-gray-600'}`}>
                                                                {homeScore}
                                                            </span>
                                                            <div className="h-8 w-[1px] bg-white/10 rotate-12 mx-1"></div>
                                                            <span className={`text-4xl md:text-5xl font-black font-teko leading-none ${awayWin ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : isDraw ? 'text-white' : 'text-gray-600'}`}>
                                                                {awayScore}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-3xl font-black text-gray-700 font-teko">VS</span>
                                                            <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">
                                                                Em Breve
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Badge de Status */}
                                                    {isFinished && (
                                                        <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                                            ENCERRADO
                                                        </span>
                                                    )}
                                                </div>

                                                {/* --- VISITANTE (DIREITA) --- */}
                                                <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
                                                    <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center p-2 border-2 transition-all ${awayWin ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#1a1a1a] border-white/5 grayscale-[0.5] opacity-80'}`}>
                                                        {duel.awayParticipant.teamLogo ? (
                                                            <img src={duel.awayParticipant.teamLogo} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-sm font-black">{duel.awayParticipant.teamName.charAt(0)}</span>
                                                        )}
                                                        {awayWin && <div className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1 rounded-full"><Trophy className="w-3 h-3" /></div>}
                                                    </div>
                                                    <div className="w-full">
                                                        <h3 className={`text-sm md:text-base font-black uppercase truncate leading-none ${awayWin ? 'text-white' : 'text-gray-500'}`}>
                                                            {duel.awayParticipant.teamName}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-gray-600 uppercase truncate mt-0.5">
                                                            {duel.awayParticipant.user?.name}
                                                        </p>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Barra inferior decorativa (só se tiver vencedor) */}
                                            {isFinished && !isDraw && (
                                                <div className={`h-1 w-full bg-gradient-to-r ${homeWin ? 'from-emerald-500 to-transparent' : 'from-transparent to-emerald-500'} opacity-30`} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}