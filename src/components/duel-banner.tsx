import { prisma } from "@/lib/prisma"
import { Swords, Shield, Trophy } from "lucide-react"

export async function DuelBanner({ roundId, currentUserId }: { roundId: string, currentUserId: string }) {
    // 1. Busca o Duelo onde EU sou mandante OU visitante nessa rodada
    const duel = await prisma.duel.findFirst({
        where: {
            roundId: roundId,
            OR: [
                { homeParticipant: { userId: currentUserId } },
                { awayParticipant: { userId: currentUserId } }
            ]
        },
        include: {
            homeParticipant: { include: { user: true } },
            awayParticipant: { include: { user: true } }
        }
    })

    if (!duel) return null // Se não tiver duelo (ex: folga ou erro), não mostra nada

    // Identifica quem é quem
    const isHome = duel.homeParticipant.userId === currentUserId
    const myTeam = isHome ? duel.homeParticipant : duel.awayParticipant
    const enemyTeam = isHome ? duel.awayParticipant : duel.homeParticipant

    // Formatação dos nomes (ex: Lanus (Lucas))
    const myName = myTeam.teamName
    const myTrainer = myTeam.user?.name.split(" ")[0] // Primeiro nome

    const enemyName = enemyTeam.teamName
    const enemyTrainer = enemyTeam.user?.name.split(" ")[0]

    return (
        <div className="w-full mb-6 relative overflow-hidden rounded-xl border border-white/10 shadow-2xl group">
            {/* Fundo com gradiente animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-[#121212] to-red-900/40 opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative p-4 md:p-6 flex items-center justify-between gap-2 md:gap-8">

                {/* --- MEU TIME (ESQUERDA) --- */}
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            {myTeam.teamLogo ? (
                                <img src={myTeam.teamLogo} className="w-full h-full object-contain" />
                            ) : (
                                <Shield className="w-8 h-8 text-blue-400" />
                            )}
                        </div>
                        <span className="absolute -bottom-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-[#121212]">
                            VOCÊ
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm md:text-lg font-black uppercase text-white leading-none tracking-tight">
                            {myName}
                        </h3>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">
                            {myTrainer}
                        </p>
                    </div>
                </div>

                {/* --- VS (MEIO) --- */}
                <div className="flex flex-col items-center justify-center">
                    <div className="text-3xl md:text-5xl font-black italic text-white/20 font-teko">VS</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <Swords className="w-3 h-3" />
                        <span>Duelo da Rodada</span>
                    </div>
                </div>

                {/* --- ADVERSÁRIO (DIREITA) --- */}
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            {enemyTeam.teamLogo ? (
                                <img src={enemyTeam.teamLogo} className="w-full h-full object-contain" />
                            ) : (
                                <Shield className="w-8 h-8 text-red-400" />
                            )}
                        </div>
                        <span className="absolute -bottom-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-[#121212]">
                            RIVAL
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm md:text-lg font-black uppercase text-white leading-none tracking-tight">
                            {enemyName}
                        </h3>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">
                            {enemyTrainer}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}