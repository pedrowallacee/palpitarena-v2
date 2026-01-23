'use client'

import { useState } from "react"
import { Eye, Flame, Trophy, AlertTriangle, Scale, Info } from "lucide-react"

// --- TIPOS MANUAIS PARA EVITAR ERROS DE PRISMA ---
interface Prediction {
    matchId: string
    homeScore: number
    awayScore: number
    userId: string
}

interface User {
    name: string
}

interface Participant {
    id: string
    userId: string
    points: number
    wins: number | null
    matchesPlayed: number | null
    teamName: string | null
    teamLogo: string | null
    user: User
    predictions: Prediction[]
}

interface Match {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo: string | null
    awayLogo: string | null
}

interface Round {
    matches: Match[]
}

interface LeaderboardProps {
    participants: any[] // Usando any para aceitar o que vem do banco sem choro
    currentRound?: any | null // Usando any para evitar conflito de tipo na Rodada
    currentUserId: string
}

export function Leaderboard({ participants = [], currentRound, currentUserId }: LeaderboardProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
    const [showRules, setShowRules] = useState(false)

    // Acha meus dados (Garante que é um array antes de buscar)
    const myData = Array.isArray(participants) ? participants.find((p: any) => p.userId === currentUserId) : null

    // Lógica Melhor Campanha
    const maxPoints = Math.max(...(participants.map((p: any) => p.points) || [0]))

    // Ordenação
    const sorted = [...participants].sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points
        const winsA = a.wins || 0
        const winsB = b.wins || 0
        if (winsB !== winsA) return winsB - winsA
        return (a.teamName || "").localeCompare(b.teamName || "")
    })

    // --- CÁLCULO DE CÓPIAS ---
    const totalGames = currentRound?.matches?.length || 0
    const allowedCopies = Math.floor(totalGames / 2)

    let copyCount = 0

    if (selectedParticipant && myData && currentRound && currentRound.matches) {
        currentRound.matches.forEach((match: any) => {
            // Conversão forçada para evitar erro de 'possibly undefined'
            const myPreds = (myData as any).predictions || []
            const advPreds = (selectedParticipant as any).predictions || []

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
                    <div className="flex-1 text-left pl-2">Clube / Seleção</div>
                    <div className="flex items-center gap-0 md:gap-2 text-center">
                        <div className="w-8 md:w-10 text-white font-black">PTS</div>
                        <div className="w-6 md:w-8" title="Partidas Jogadas">PJ</div>
                        <div className="w-6 md:w-8 hidden md:block" title="Vitórias">VIT</div>
                    </div>
                </div>

                {/* LISTA */}
                <div className="divide-y divide-white/5 bg-[#0f0f0f]">
                    {sorted.map((p: any, index: number) => {
                        const pos = index + 1
                        const isBestCampaign = p.points === maxPoints && p.points > 0
                        const isMe = p.userId === currentUserId

                        let posBg = "text-gray-500"
                        let rowBorder = "border-l-2 border-transparent"
                        if (pos === 1) {
                            posBg = "text-blue-400 font-black"
                            rowBorder = "border-l-2 border-blue-500 bg-blue-500/5"
                        } else if (pos <= 4) {
                            posBg = "text-blue-300"
                            rowBorder = "border-l-2 border-blue-500/50"
                        }

                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedParticipant(p)}
                                className={`w-full flex items-center py-3 px-2 transition-colors hover:bg-white/5 text-left group ${rowBorder} ${isMe ? 'bg-emerald-500/5' : ''}`}
                            >
                                <div className={`w-8 text-center text-sm ${posBg}`}>{pos}</div>
                                <div className="flex-1 flex items-center gap-3 pl-2 min-w-0">
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        {p.teamLogo ? (
                                            <img src={p.teamLogo} className="w-full h-full object-contain" alt={p.teamName} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">{p.teamName?.charAt(0)}</div>
                                        )}
                                        {isBestCampaign && (
                                            <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-0.5 border border-[#0f0f0f]" title="Melhor Campanha">
                                                <Flame className="w-3 h-3 text-white fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className={`text-xs md:text-sm font-bold truncate flex items-center gap-1 ${pos === 1 ? 'text-white' : 'text-gray-300'} group-hover:text-white`}>
                                            {p.teamName}
                                            {isMe && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded border border-emerald-500/30">VOCÊ</span>}
                                        </span>
                                        <span className="text-[9px] text-gray-600 uppercase font-bold truncate group-hover:text-gray-400">
                                            {p.user?.name || "CPU"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0 md:gap-2 text-center text-xs font-mono">
                                    <div className="w-8 md:w-10 font-black text-white text-sm">{p.points}</div>
                                    <div className="w-6 md:w-8 text-gray-400">{p.matchesPlayed}</div>
                                    <div className="w-6 md:w-8 text-gray-500 hidden md:block">{p.wins}</div>
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
                        <div className="relative bg-gradient-to-br from-indigo-900 via-[#151515] to-[#121212] p-6 text-center border-b border-white/5">
                            <button onClick={() => setSelectedParticipant(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 hover:bg-white/20 rounded-full text-white flex items-center justify-center transition-all">✕</button>

                            <div className="w-20 h-20 mx-auto rounded-full bg-[#121212] p-1 border-4 border-[#121212] shadow-xl mb-3 relative">
                                {selectedParticipant.teamLogo ? (
                                    <img src={selectedParticipant.teamLogo} className="w-full h-full rounded-full object-contain bg-white/5" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-black text-gray-500">{selectedParticipant.teamName?.charAt(0)}</div>
                                )}
                                <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 border-[#121212]">
                                    <Trophy className="w-3 h-3 text-black" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black font-teko uppercase text-white leading-none mb-1">{selectedParticipant.teamName}</h2>
                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{selectedParticipant.user?.name}</p>

                            {/* ALERTA DE CÓPIAS */}
                            {selectedParticipant.userId !== currentUserId && (
                                <div className={`mt-4 mx-auto max-w-[200px] px-3 py-2 rounded-lg border flex items-center justify-center gap-2 ${isExceeded ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                    {isExceeded ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Scale className="w-4 h-4" />}
                                    <div className="text-left leading-none">
                                        <p className="text-[9px] font-bold uppercase">Cópias Detectadas</p>
                                        <p className="text-sm font-black font-mono">{copyCount} <span className="text-gray-500 text-[10px]">/ {allowedCopies} Permitidas</span></p>
                                    </div>
                                </div>
                            )}

                            {isExceeded && selectedParticipant.userId !== currentUserId && (
                                <div className="mt-2 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded inline-block animate-pulse">
                                    🚫 LIMITE EXCEDIDO: RISCO DE W.O
                                </div>
                            )}
                        </div>

                        {/* LISTA DE JOGOS */}
                        <div className="p-4 flex-1 overflow-y-auto bg-[#0a0a0a]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    Cartela da Rodada
                                </h3>
                                <button onClick={() => setShowRules(!showRules)} className="text-[10px] flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold uppercase">
                                    <Info className="w-3 h-3" /> Regras
                                </button>
                            </div>

                            {/* REGRAS */}
                            {showRules && (
                                <div className="bg-[#151515] border border-white/10 rounded-lg p-3 mb-4 text-[10px] text-gray-400 space-y-1 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-white font-bold mb-2">📋 Limites de Cópia por Jogos:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>6 Jogos: <span className="text-white">Max 3</span></div>
                                        <div>8 Jogos: <span className="text-white">Max 4</span></div>
                                        <div>10 Jogos: <span className="text-white">Max 5</span></div>
                                        <div>12 Jogos: <span className="text-white">Max 6</span></div>
                                    </div>
                                    <p className="text-red-400 font-bold mt-2">Punição: Desclassificação (W.O)</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                {currentRound?.matches?.map((match: any) => {
                                    // CASTING para evitar erro
                                    const advPreds = (selectedParticipant as any).predictions || []
                                    const myPreds = (myData as any)?.predictions || []

                                    const advPred = advPreds.find((p: any) => p.matchId === match.id)
                                    const myPred = myPreds.find((p: any) => p.matchId === match.id)

                                    const isCopy = selectedParticipant.userId !== currentUserId && advPred && myPred && advPred.homeScore === myPred.homeScore && advPred.awayScore === myPred.awayScore

                                    return (
                                        <div key={match.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isCopy ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 w-[35%] justify-end">
                                                <span className="truncate">{match.homeTeam}</span>
                                                {match.homeLogo && <img src={match.homeLogo} className="w-5 h-5 object-contain" />}
                                            </div>

                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`px-3 py-1 rounded text-white font-mono text-sm font-bold border shadow-inner min-w-[60px] text-center ${isCopy ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-black/40 border-white/10'}`}>
                                                    {advPred ? `${advPred.homeScore} - ${advPred.awayScore}` : "- x -"}
                                                </div>

                                                {selectedParticipant.userId !== currentUserId && (
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isCopy ? 'text-red-500' : 'text-gray-600'}`}>
                                                        {isCopy ? 'CÓPIA' : 'ADV'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 w-[35%]">
                                                {match.awayLogo && <img src={match.awayLogo} className="w-5 h-5 object-contain" />}
                                                <span className="truncate">{match.awayTeam}</span>
                                            </div>
                                        </div>
                                    )
                                })}

                                {(!currentRound || !currentRound.matches || currentRound.matches.length === 0) && (
                                    <p className="text-center text-gray-600 text-xs py-4">Nenhum jogo na rodada atual.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}