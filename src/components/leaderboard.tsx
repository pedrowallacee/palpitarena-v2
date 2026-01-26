'use client'

import { useState } from "react"
import { Eye, Flame, Trophy, AlertTriangle, Scale, Info, Medal } from "lucide-react"

// --- TIPOS (Para evitar erro de TypeScript) ---
interface Prediction {
    matchId: string
    homeScore: number
    awayScore: number
    userId: string
    pointsEarned?: number // Adicionado para mostrar pontos se já tiver
    exactScore?: boolean
}

interface User {
    name: string
    image?: string | null
}

interface Participant {
    id: string
    userId: string
    points: number
    exactScores: number
    wins: number | null
    matchesPlayed: number | null
    teamName?: string | null // Opcional, caso use nome de time
    teamLogo?: string | null
    user: User
    predictions: Prediction[] // Lista de palpites desse user
}

interface Match {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo: string | null
    awayLogo: string | null
    resultHome?: number | null
    resultAway?: number | null
    status?: string
}

interface Round {
    name: string
    matches: Match[]
}

interface LeaderboardProps {
    participants: any[]
    currentRound?: any
    currentUserId: string
}

export function Leaderboard({ participants = [], currentRound, currentUserId }: LeaderboardProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
    const [showRules, setShowRules] = useState(false)

    // Acha meus dados para comparar cópias
    const myData = Array.isArray(participants) ? participants.find((p: any) => p.userId === currentUserId) : null

    // Lógica Melhor Campanha
    const maxPoints = Math.max(...(participants.map((p: any) => p.points) || [0]))

    // Ordenação (Pontos > Cravadas > Nome)
    const sorted = [...participants].sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points
        const exactA = a.exactScores || 0
        const exactB = b.exactScores || 0
        if (exactB !== exactA) return exactB - exactA
        return (a.user.name || "").localeCompare(b.user.name || "")
    })

    // --- CÁLCULO DE CÓPIAS ---
    const totalGames = currentRound?.matches?.length || 0
    const allowedCopies = Math.floor(totalGames / 2) // Regra de 50%

    let copyCount = 0

    if (selectedParticipant && myData && currentRound && currentRound.matches) {
        currentRound.matches.forEach((match: any) => {
            const myPreds = (myData as any).predictions || []
            const advPreds = (selectedParticipant as any).predictions || []

            // Acha o palpite de cada um para ESSE jogo
            // (IMPORTANTE: O 'prediction' vem do banco com matchId ou id do jogo)
            // Se o seu banco salvar como prediction.matchId, use matchId.
            // Se salvar a relação direta, pode ter que ajustar.
            // Aqui assumimos que a lista 'predictions' dentro do user tem matchId.

            // Correção: Como prediction vem do include, ele tem matchId
            const myPred = myPreds.find((p: any) => p.matchId === match.id)
            const advPred = advPreds.find((p: any) => p.matchId === match.id)

            if (myPred && advPred) {
                if (myPred.homeScore === advPred.homeScore && myPred.awayScore === advPred.awayScore) {
                    copyCount++
                }
            }
        })
    }

    const isExceeded = copyCount > allowedCopies

    return (
        <>
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans">
                {/* CABEÇALHO */}
                <div className="bg-[#1a1a1a] flex items-center text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-white/5 py-3 px-2">
                    <div className="w-8 text-center">Pos</div>
                    <div className="flex-1 text-left pl-2">Treinador</div>
                    <div className="flex items-center gap-0 md:gap-2 text-center">
                        <div className="w-8 md:w-10 text-white font-black">PTS</div>
                        <div className="w-8 md:w-10 text-gray-400" title="Cravadas">CRAV</div>
                    </div>
                </div>

                {/* LISTA */}
                <div className="divide-y divide-white/5 bg-[#0f0f0f]">
                    {sorted.map((p: any, index: number) => {
                        const pos = index + 1
                        const isBestCampaign = p.points === maxPoints && p.points > 0
                        const isMe = p.userId === currentUserId

                        // Estilo do Ranking
                        let posContent: React.ReactNode = <span className="text-gray-500 font-mono">{pos}</span>
                        let rowBorder = "border-l-2 border-transparent"

                        if (pos === 1) {
                            posContent = <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                            rowBorder = "border-l-2 border-yellow-500 bg-yellow-500/5"
                        } else if (pos === 2) {
                            posContent = <Medal className="w-4 h-4 text-gray-300 mx-auto" />
                        } else if (pos === 3) {
                            posContent = <Medal className="w-4 h-4 text-amber-700 mx-auto" />
                        }

                        if (isMe) rowBorder += " border-emerald-500 bg-emerald-500/5"

                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedParticipant(p)}
                                className={`w-full flex items-center py-3 px-2 transition-colors hover:bg-white/5 text-left group ${rowBorder}`}
                            >
                                <div className="w-8 text-center">{posContent}</div>

                                <div className="flex-1 flex items-center gap-3 pl-2 min-w-0">
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        {p.user.image ? (
                                            <img src={p.user.image} className="w-full h-full rounded-full object-cover border border-white/10" alt="" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                {p.user.name?.charAt(0)}
                                            </div>
                                        )}

                                        {/* 🔥 MELHOR CAMPANHA */}
                                        {isBestCampaign && (
                                            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5 border border-[#0f0f0f] animate-pulse" title="Melhor Campanha">
                                                <Flame className="w-2.5 h-2.5 text-white fill-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col truncate">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs md:text-sm font-bold truncate ${isMe ? 'text-emerald-400' : 'text-gray-200'} group-hover:text-white`}>
                                                {p.user.name}
                                            </span>
                                            {isMe && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded uppercase tracking-wider font-bold">VOCÊ</span>}
                                        </div>

                                        <span className="text-[8px] text-gray-600 hidden group-hover:flex items-center gap-1 mt-0.5">
                                            <Eye className="w-2.5 h-2.5" /> Ver Cartela
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-0 md:gap-2 text-center text-xs font-mono">
                                    <div className="w-8 md:w-10 font-black text-white text-sm">{p.points}</div>
                                    <div className="w-8 md:w-10 text-gray-500 font-bold">{p.exactScores || 0}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* --- MODAL DA CARTELA --- */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedParticipant(null)}>
                    <div className="bg-[#121212] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>

                        {/* HEADER DO MODAL */}
                        <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#121212] p-6 text-center border-b border-white/5">
                            <button onClick={() => setSelectedParticipant(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 hover:bg-white/20 rounded-full text-white flex items-center justify-center transition-all">✕</button>

                            <div className="w-20 h-20 mx-auto rounded-full bg-[#121212] p-1 border-4 border-[#121212] shadow-xl mb-3 relative">
                                {selectedParticipant.user.image ? (
                                    <img src={selectedParticipant.user.image} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-black text-gray-500">
                                        {selectedParticipant.user.name?.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 border-[#121212]">
                                    <Trophy className="w-3 h-3 text-black" />
                                </div>
                            </div>

                            <h2 className="text-xl font-black uppercase text-white leading-none mb-1">{selectedParticipant.user.name}</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedParticipant.points} PONTOS TOTAIS</p>

                            {/* ALERTA DE CÓPIAS (Só aparece se não for você) */}
                            {selectedParticipant.userId !== currentUserId && (
                                <div className={`mt-4 mx-auto max-w-[220px] px-3 py-2 rounded-lg border flex items-center justify-center gap-3 transition-colors ${isExceeded ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                    {isExceeded ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Scale className="w-5 h-5" />}
                                    <div className="text-left leading-none">
                                        <p className="text-[9px] font-bold uppercase mb-0.5">Detector de Cópia</p>
                                        <p className="text-sm font-black font-mono">
                                            {copyCount} <span className="text-[10px] opacity-60 font-normal">iguais a você</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isExceeded && selectedParticipant.userId !== currentUserId && (
                                <div className="mt-2 text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded inline-block animate-pulse uppercase tracking-wide border border-red-500/20">
                                    🚫 Limite de {allowedCopies} cópias excedido
                                </div>
                            )}
                        </div>

                        {/* LISTA DE JOGOS DA RODADA ATUAL */}
                        <div className="p-4 flex-1 overflow-y-auto bg-[#0a0a0a]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    Palpites: {currentRound?.name || "Rodada Atual"}
                                </h3>
                                <button onClick={() => setShowRules(!showRules)} className="text-[10px] flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold uppercase">
                                    <Info className="w-3 h-3" /> Regras
                                </button>
                            </div>

                            {/* REGRAS EXPANSÍVEIS */}
                            {showRules && (
                                <div className="bg-[#151515] border border-white/10 rounded-lg p-3 mb-4 text-[10px] text-gray-400 space-y-1 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-white font-bold mb-2">📋 Regras de Fair Play (Anti-Cópia):</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>6 Jogos: <span className="text-white">Max 3</span></div>
                                        <div>8 Jogos: <span className="text-white">Max 4</span></div>
                                        <div>10 Jogos: <span className="text-white">Max 5</span></div>
                                        <div>12 Jogos: <span className="text-white">Max 6</span></div>
                                    </div>
                                    <p className="text-red-400 font-bold mt-2">Punição: Desclassificação da Rodada (W.O)</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                {currentRound?.matches?.map((match: any) => {
                                    // CASTING para evitar erro
                                    const advPreds = (selectedParticipant as any).predictions || []
                                    const myPreds = (myData as any)?.predictions || []

                                    const advPred = advPreds.find((p: any) => p.matchId === match.id)
                                    const myPred = myPreds.find((p: any) => p.matchId === match.id)

                                    // É Cópia? (Só conta se não for eu mesmo e se os dois tiverem palpitado)
                                    const isCopy = selectedParticipant.userId !== currentUserId && advPred && myPred && advPred.homeScore === myPred.homeScore && advPred.awayScore === myPred.awayScore

                                    // Cores do resultado (Verde se pontuou, Vermelho se errou)
                                    let borderColor = "border-white/5"
                                    let scoreColor = "text-white"
                                    let pointsBadge = null

                                    // Se o jogo acabou e tem resultado
                                    if ((match.status === 'FINISHED' || match.resultHome !== null) && advPred) {
                                        if (advPred.exactScore) {
                                            borderColor = "border-yellow-500/50"
                                            scoreColor = "text-yellow-400"
                                            pointsBadge = <span className="text-[9px] text-yellow-500 font-black">+25</span>
                                        } else if (advPred.pointsEarned > 0) {
                                            borderColor = "border-emerald-500/30"
                                            scoreColor = "text-emerald-400"
                                            pointsBadge = <span className="text-[9px] text-emerald-500 font-black">+{advPred.pointsEarned}</span>
                                        } else {
                                            borderColor = "border-red-500/20"
                                            scoreColor = "text-red-500"
                                            pointsBadge = <span className="text-[9px] text-red-500 font-black">+0</span>
                                        }
                                    }

                                    return (
                                        <div key={match.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isCopy ? 'bg-red-500/5 border-red-500/20' : `bg-white/5 ${borderColor}`}`}>

                                            {/* TIME CASA */}
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 w-[35%] justify-end">
                                                <span className="truncate hidden sm:block">{match.homeTeam}</span>
                                                <span className="truncate sm:hidden">{match.homeTeam.substring(0,3).toUpperCase()}</span>
                                                {match.homeLogo ? <img src={match.homeLogo} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-gray-700 rounded-full"/>}
                                            </div>

                                            {/* PLACAR APOSTADO */}
                                            <div className="flex flex-col items-center gap-1 min-w-[80px]">
                                                <div className={`px-2 py-1 rounded font-mono text-sm font-bold border shadow-inner w-full text-center flex items-center justify-center gap-1 ${isCopy ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-black/40 border-white/10 ' + scoreColor}`}>
                                                    {advPred ? (
                                                        <><span>{advPred.homeScore}</span><span className="opacity-50 text-[10px]">-</span><span>{advPred.awayScore}</span></>
                                                    ) : (
                                                        <span className="text-gray-600">- x -</span>
                                                    )}
                                                </div>

                                                {/* STATUS (Cópia ou Pontos) */}
                                                <div className="h-4 flex items-center justify-center">
                                                    {isCopy ? (
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-red-500 animate-pulse">CÓPIA</span>
                                                    ) : (
                                                        pointsBadge
                                                    )}
                                                </div>
                                            </div>

                                            {/* TIME FORA */}
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 w-[35%]">
                                                {match.awayLogo ? <img src={match.awayLogo} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-gray-700 rounded-full"/>}
                                                <span className="truncate hidden sm:block">{match.awayTeam}</span>
                                                <span className="truncate sm:hidden">{match.awayTeam.substring(0,3).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    )
                                })}

                                {(!currentRound || !currentRound.matches || currentRound.matches.length === 0) && (
                                    <p className="text-center text-gray-600 text-xs py-8 border border-dashed border-white/10 rounded-xl">
                                        Nenhuma rodada ativa no momento.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}