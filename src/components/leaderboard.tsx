'use client'

import { useState, useEffect } from "react"
import { Flame, Trophy, AlertTriangle, Scale, Info, Medal, Swords, ShieldCheck } from "lucide-react"

// --- TIPOS ---
interface Prediction {
    matchId: string
    homeScore: number
    awayScore: number
    userId: string
    pointsEarned?: number
    exactScore?: boolean
    createdAt?: string | Date
}

interface User {
    name: string
    image?: string | null
}

interface Participant {
    id: string
    userId: string
    points: number
    // Campos de Grupo
    group?: string | null
    groupPoints?: number
    groupWins?: number
    groupSG?: number      // <--- IMPORTANTE
    groupGF?: number      // <--- IMPORTANTE

    // Campos Gerais
    goalDifference?: number
    goalsScored?: number

    exactScores: number
    wins: number | null
    matchesPlayed: number | null
    teamName?: string | null
    teamLogo?: string | null
    user: User
    predictions: Prediction[]
}

interface LeaderboardProps {
    participants: any[]
    currentRound?: any
    currentUserId: string
}

export function Leaderboard({ participants = [], currentRound, currentUserId }: LeaderboardProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
    const [showRules, setShowRules] = useState(false)
    const [isDirectOpponent, setIsDirectOpponent] = useState(false)

    const myData = Array.isArray(participants) ? participants.find((p: any) => p.userId === currentUserId) : null

    // --- LÓGICA DE GRUPOS ---
    const groups = Array.from(new Set(participants.map((p: any) => p.group).filter(Boolean))).sort()
    const hasGroups = groups.length > 0

    const [activeTab, setActiveTab] = useState(myData?.group || groups[0] || 'GERAL')

    useEffect(() => {
        if (myData?.group) setActiveTab(myData.group)
    }, [myData?.group])

    const filteredParticipants = hasGroups
        ? participants.filter((p: any) => p.group === activeTab)
        : participants

    // --- ORDENAÇÃO CORRIGIDA (CRITÉRIOS FIFA) ---
    const sorted = [...filteredParticipants].sort((a: any, b: any) => {
        // 1. PONTOS
        const pointsA = hasGroups ? (a.groupPoints || 0) : a.points
        const pointsB = hasGroups ? (b.groupPoints || 0) : b.points
        if (pointsB !== pointsA) return pointsB - pointsA

        // 2. VITÓRIAS
        const winsA = hasGroups ? (a.groupWins || 0) : (a.wins || 0)
        const winsB = hasGroups ? (b.groupWins || 0) : (b.wins || 0)
        if (winsB !== winsA) return winsB - winsA

        // 3. SALDO DE GOLS (SG) - Faltava isso!
        const sgA = hasGroups ? (a.groupSG || 0) : (a.goalDifference || 0)
        const sgB = hasGroups ? (b.groupSG || 0) : (b.goalDifference || 0)
        if (sgB !== sgA) return sgB - sgA

        // 4. GOLS PRÓ (GP)
        const gfA = hasGroups ? (a.groupGF || 0) : (a.goalsScored || 0)
        const gfB = hasGroups ? (b.groupGF || 0) : (b.goalsScored || 0)
        if (gfB !== gfA) return gfB - gfA

        // 5. CRAVADAS (Desempate final)
        const exactA = a.exactScores || 0
        const exactB = b.exactScores || 0
        if (exactB !== exactA) return exactB - exactA

        // 6. ORDEM ALFABÉTICA
        return (a.teamName || a.user.name || "").localeCompare(b.teamName || b.user.name || "")
    })

    const maxPointsCurrentTab = Math.max(...(sorted.map((p: any) => hasGroups ? p.groupPoints : p.points) || [0]))

    // --- CÁLCULO DE CÓPIAS ---
    let copyCount = 0
    if (selectedParticipant && myData && currentRound && currentRound.matches) {
        currentRound.matches.forEach((match: any) => {
            const myPreds = (myData as any).predictions || []
            const advPreds = (selectedParticipant as any).predictions || []
            const myPred = myPreds.find((p: any) => p.matchId === match.id)
            const advPred = advPreds.find((p: any) => p.matchId === match.id)
            if (myPred && advPred && myPred.homeScore === advPred.homeScore && myPred.awayScore === advPred.awayScore) {
                copyCount++
            }
        })
    }

    const totalGames = currentRound?.matches?.length || 0
    const allowedCopies = Math.floor(totalGames / 2)
    const isExceeded = copyCount > allowedCopies

    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans">

            {/* --- NAVEGAÇÃO DE GRUPOS (ABAS) --- */}
            {hasGroups && (
                <div className="flex items-center bg-[#0a0a0a] border-b border-white/5 p-1 overflow-x-auto gap-1 scrollbar-hide">
                    {groups.map(group => (
                        <button
                            key={group as string}
                            onClick={() => setActiveTab(group as string)}
                            className={`flex-1 min-w-[50px] py-2 text-[10px] font-black uppercase rounded transition-all
                                ${activeTab === group
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            GRP {group as string}
                        </button>
                    ))}
                </div>
            )}

            {/* CABEÇALHO DA TABELA */}
            <div className="bg-[#1a1a1a] flex items-center text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-white/5 py-3 px-2">
                <div className="w-8 text-center">Pos</div>
                <div className="flex-1 text-left pl-2">Clube / Treinador</div>
                <div className="flex items-center gap-0 md:gap-2 text-center">
                    <div className="w-8 md:w-10 text-white font-black">PTS</div>
                    {/* Alterei de CRAV para SG se for grupo, pois é o critério principal visual */}
                    <div className="w-8 md:w-10 text-gray-400" title={hasGroups ? "Saldo de Gols" : "Cravadas"}>
                        {hasGroups ? "SG" : "CRAV"}
                    </div>
                </div>
            </div>

            {/* LISTA DE PARTICIPANTES */}
            <div className="divide-y divide-white/5 bg-[#0f0f0f] max-h-[500px] overflow-y-auto">
                {sorted.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 font-bold uppercase">Grupo Vazio</div>
                ) : (
                    sorted.map((p: any, index: number) => {
                        const pos = index + 1
                        const points = hasGroups ? (p.groupPoints || 0) : p.points
                        const sg = hasGroups ? (p.groupSG || 0) : (p.goalDifference || 0)

                        const isBestCampaign = points === maxPointsCurrentTab && points > 0
                        const isMe = p.userId === currentUserId

                        let posContent: React.ReactNode = <span className="text-gray-500 font-mono">{pos}</span>
                        let rowBorder = "border-l-2 border-transparent"

                        // Lógica de Cores
                        if (hasGroups) {
                            if (pos <= 2) {
                                rowBorder = "border-l-2 border-emerald-500 bg-emerald-500/5"
                                posContent = <span className="text-emerald-500 font-black">{pos}º</span>
                            }
                        } else {
                            if (pos === 1) {
                                posContent = <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                                rowBorder = "border-l-2 border-yellow-500 bg-yellow-500/5"
                            } else if (pos === 2) {
                                posContent = <Medal className="w-4 h-4 text-gray-300 mx-auto" />
                            } else if (pos === 3) {
                                posContent = <Medal className="w-4 h-4 text-amber-700 mx-auto" />
                            }
                        }

                        if (isMe) rowBorder = "border-l-2 border-blue-500 bg-blue-500/10"

                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedParticipant(p)}
                                className={`w-full flex items-center py-3 px-2 transition-colors hover:bg-white/5 text-left group ${rowBorder}`}
                            >
                                <div className="w-8 text-center">{posContent}</div>

                                <div className="flex-1 flex items-center gap-3 pl-2 min-w-0">
                                    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                                        {p.teamLogo ? (
                                            <img src={p.teamLogo} className="w-full h-full object-contain" alt={p.teamName} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white/10">
                                                {p.teamName?.charAt(0) || p.user.name.charAt(0)}
                                            </div>
                                        )}
                                        {isBestCampaign && (
                                            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5 border border-[#0f0f0f] animate-pulse">
                                                <Flame className="w-3 h-3 text-white fill-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-start truncate">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold truncate ${isMe ? 'text-blue-400' : 'text-white'} group-hover:text-emerald-300`}>
                                                {p.teamName || "Sem Clube"}
                                            </span>
                                            {isMe && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 rounded uppercase tracking-wider font-bold">VOCÊ</span>}
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide truncate">
                                            {p.user.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-0 md:gap-2 text-center text-xs font-mono">
                                    <div className="w-8 md:w-10 font-black text-white text-sm">{points}</div>

                                    {/* Mostra SG se for grupo, ou Cravadas se for liga */}
                                    <div className={`w-8 md:w-10 font-bold ${sg > 0 ? 'text-emerald-500' : sg < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {hasGroups
                                            ? (sg > 0 ? `+${sg}` : sg)
                                            : (p.exactScores || 0)
                                        }
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>

            {/* --- MODAL (Mantido igual) --- */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedParticipant(null)}>
                    <div className="bg-[#121212] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>

                        <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#121212] p-6 text-center border-b border-white/5">
                            <button onClick={() => setSelectedParticipant(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 hover:bg-white/20 rounded-full text-white flex items-center justify-center transition-all">✕</button>

                            <div className="w-20 h-20 mx-auto mb-3 relative">
                                {selectedParticipant.teamLogo ? (
                                    <img src={selectedParticipant.teamLogo} className="w-full h-full object-contain drop-shadow-2xl" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-black text-gray-500">
                                        {selectedParticipant.teamName?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black font-teko uppercase text-white leading-none mb-1">{selectedParticipant.teamName || "Sem Clube"}</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Treinador: {selectedParticipant.user.name}</p>

                            {selectedParticipant.group && (
                                <div className="mb-4 inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs font-bold uppercase">
                                    Grupo {selectedParticipant.group}
                                </div>
                            )}

                            {selectedParticipant.userId !== currentUserId && (
                                <div className="flex flex-col items-center gap-3">
                                    <button
                                        onClick={() => setIsDirectOpponent(!isDirectOpponent)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isDirectOpponent ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        <Swords className="w-3 h-3" />
                                        {isDirectOpponent ? "Modo Duelo Ativo" : "Comparar Comigo"}
                                    </button>

                                    {isDirectOpponent && (
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isExceeded ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                            <Scale className="w-3 h-3" />
                                            <span className="text-xs font-mono">
                                                <strong className="text-white">{copyCount}</strong> palpites iguais
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto bg-[#0a0a0a]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    Palpites: {currentRound?.name || "Rodada Atual"}
                                </h3>
                                <button onClick={() => setShowRules(!showRules)} className="text-[10px] flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold uppercase">
                                    <Info className="w-3 h-3" /> Regras
                                </button>
                            </div>

                            {showRules && (
                                <div className="bg-[#151515] border border-white/10 rounded-lg p-3 mb-4 text-[10px] text-gray-400 space-y-1 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-white font-bold mb-2 uppercase border-b border-white/5 pb-1">📋 Limites de Cópia (50%):</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                                        <div>[ 06 Jogos ] - <span className="text-emerald-400 font-bold">Max 3</span></div>
                                        <div>[ 08 Jogos ] - <span className="text-emerald-400 font-bold">Max 4</span></div>
                                        <div>[ 10 Jogos ] - <span className="text-emerald-400 font-bold">Max 5</span></div>
                                        <div>[ 12 Jogos ] - <span className="text-emerald-400 font-bold">Max 6</span></div>
                                        <div>[ 14 Jogos ] - <span className="text-emerald-400 font-bold">Max 7</span></div>
                                        <div>[ 16 Jogos ] - <span className="text-emerald-400 font-bold">Max 8</span></div>
                                        <div>[ 18 Jogos ] - <span className="text-emerald-400 font-bold">Max 9</span></div>
                                        <div>[ 20 Jogos ] - <span className="text-emerald-400 font-bold">Max 10</span></div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-white/5">
                                        <p className="text-red-400 font-bold uppercase flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Punição: W.O na rodada.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {currentRound?.matches?.map((match: any) => {
                                    const advPreds = (selectedParticipant as any).predictions || []
                                    const myPreds = (myData as any)?.predictions || []
                                    const advPred = advPreds.find((p: any) => p.matchId === match.id)
                                    const myPred = myPreds.find((p: any) => p.matchId === match.id)

                                    const isCopy = selectedParticipant.userId !== currentUserId && advPred && myPred && advPred.homeScore === myPred.homeScore && advPred.awayScore === myPred.awayScore
                                    const highlightCopy = isCopy && isDirectOpponent

                                    let timeStatus = null
                                    if (isCopy && advPred?.createdAt && myPred?.createdAt) {
                                        const advDate = new Date(advPred.createdAt)
                                        const myDate = new Date(myPred.createdAt)
                                        if (myDate < advDate) timeStatus = "original"
                                        else timeStatus = "copia"
                                    }

                                    let borderColor = "border-white/5"
                                    let scoreColor = "text-white"
                                    let pointsBadge = null

                                    if ((match.status === 'FINISHED' || match.resultHome !== null) && advPred) {
                                        if (advPred.exactScore) {
                                            borderColor = "border-yellow-500/50"; scoreColor = "text-yellow-400"; pointsBadge = <span className="text-[9px] text-yellow-500 font-black">+25</span>
                                        } else if (advPred.pointsEarned > 0) {
                                            borderColor = "border-emerald-500/30"; scoreColor = "text-emerald-400"; pointsBadge = <span className="text-[9px] text-emerald-500 font-black">+{advPred.pointsEarned}</span>
                                        } else {
                                            borderColor = "border-red-500/20"; scoreColor = "text-red-500"; pointsBadge = <span className="text-[9px] text-red-500 font-black">+0</span>
                                        }
                                    }

                                    return (
                                        <div key={match.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${highlightCopy ? 'bg-red-500/5 border-red-500/20' : `bg-white/5 ${borderColor}`}`}>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 w-[30%] justify-end">
                                                <span className="truncate hidden sm:block">{match.homeTeam}</span>
                                                <span className="truncate sm:hidden">{match.homeTeam.substring(0,3).toUpperCase()}</span>
                                                {match.homeLogo && <img src={match.homeLogo} className="w-5 h-5 object-contain" />}
                                            </div>
                                            <div className="flex flex-col items-center gap-1 min-w-[100px]">
                                                <div className={`px-2 py-1 rounded font-mono text-sm font-bold border shadow-inner w-full text-center flex items-center justify-center gap-1 ${highlightCopy ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-black/40 border-white/10 ' + scoreColor}`}>
                                                    {advPred ? (
                                                        <><span>{advPred.homeScore}</span><span className="opacity-50 text-[10px]">-</span><span>{advPred.awayScore}</span></>
                                                    ) : (
                                                        <span className="text-gray-600">- x -</span>
                                                    )}
                                                </div>
                                                <div className="h-4 flex items-center justify-center gap-2">
                                                    {highlightCopy ? (
                                                        <>
                                                            {timeStatus === 'original' && <span className="flex items-center gap-1 text-[8px] font-black uppercase text-red-400 bg-red-500/10 px-1.5 rounded border border-red-500/20 animate-pulse"><AlertTriangle className="w-2.5 h-2.5" /> COPIOU</span>}
                                                            {timeStatus === 'copia' && <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 rounded border border-emerald-500/20"><ShieldCheck className="w-2.5 h-2.5" /> ORIGINAL</span>}
                                                            {!timeStatus && <span className="text-[8px] font-black uppercase text-gray-500">IGUAL</span>}
                                                        </>
                                                    ) : pointsBadge}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 w-[30%]">
                                                {match.awayLogo && <img src={match.awayLogo} className="w-5 h-5 object-contain" />}
                                                <span className="truncate hidden sm:block">{match.awayTeam}</span>
                                                <span className="truncate sm:hidden">{match.awayTeam.substring(0,3).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}