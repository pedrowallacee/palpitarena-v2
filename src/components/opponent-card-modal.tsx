'use client'

import { X, Trophy } from "lucide-react"

interface OpponentCardModalProps {
    isOpen: boolean
    onClose: () => void
    participant: any
    round: any
}

export function OpponentCardModal({ isOpen, onClose, participant, round }: OpponentCardModalProps) {
    if (!isOpen || !participant || !round) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                {/* CABEÇALHO */}
                <div className="bg-[#1a1a1a] p-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {participant.user.image ? (
                            <img src={participant.user.image} className="w-10 h-10 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                                {participant.user.name?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-bold leading-tight">{participant.user.name}</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                {participant.points} Pontos Totais
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* CORPO: LISTA DE JOGOS */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Palpites: {round.name}
                        </span>
                    </div>

                    {round.matches.map((match: any) => {
                        // Acha o palpite desse usuário específico
                        const prediction = match.predictions?.find((p: any) => p.userId === participant.userId)

                        // Verifica status do jogo
                        const isFinished = match.status === 'FINISHED' || match.status === 'FT' || (match.resultHome !== null && match.resultAway !== null)

                        // Cores
                        let borderColor = "border-white/5"
                        let scoreColor = "text-white"

                        if (isFinished && prediction) {
                            if (prediction.exactScore) {
                                borderColor = "border-yellow-500/50"
                                scoreColor = "text-yellow-400"
                            } else if (prediction.pointsEarned > 0) {
                                borderColor = "border-emerald-500/30"
                                scoreColor = "text-emerald-400"
                            } else {
                                borderColor = "border-red-500/20"
                                scoreColor = "text-red-500"
                            }
                        }

                        return (
                            <div key={match.id} className={`bg-[#0a0a0a] border ${borderColor} p-3 rounded-lg flex items-center justify-between`}>
                                {/* Times */}
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-[10px] font-bold text-gray-400 w-8 text-right truncate">{match.homeTeam.substring(0,3).toUpperCase()}</span>
                                    <img src={match.homeLogo} className="w-6 h-6 object-contain" />
                                    <span className="text-[10px] text-gray-600">x</span>
                                    <img src={match.awayLogo} className="w-6 h-6 object-contain" />
                                    <span className="text-[10px] font-bold text-gray-400 w-8 truncate">{match.awayTeam.substring(0,3).toUpperCase()}</span>
                                </div>

                                {/* Placar Apostado */}
                                <div className={`font-mono font-bold text-sm bg-white/5 px-2 py-1 rounded tracking-widest ${scoreColor}`}>
                                    {prediction ? `${prediction.homeScore} - ${prediction.awayScore}` : "-"}
                                </div>

                                {/* Pontos (Se acabou) */}
                                {isFinished && prediction && (
                                    <div className="w-6 text-right">
                                        <span className={`text-xs font-black ${prediction.pointsEarned > 0 ? 'text-emerald-500' : 'text-gray-600'}`}>
                                            +{prediction.pointsEarned}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* RODAPÉ */}
                <div className="bg-[#1a1a1a] p-3 text-center border-t border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase">
                        Visualizando cartela de oponente
                    </p>
                </div>
            </div>
        </div>
    )
}