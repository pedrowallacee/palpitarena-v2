'use client'

import { useState } from "react"
import Link from "next/link"
import { Calendar, ChevronRight, CheckCircle2, Trophy, Edit3, Eye, Trash2 } from "lucide-react"
import { deleteRoundAction } from "@/actions/delete-round-action"

interface RoundProps {
    round: {
        id: string
        name: string
        status: string
        deadline: Date | string
        matches: any[]
    }
    slug: string
    canManage?: boolean
    currentUserId?: string
}

export function RoundListItem({ round, slug, canManage, currentUserId }: RoundProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const deadlineDate = new Date(round.deadline)
    const now = new Date()
    const isClosed = now > deadlineDate || round.status === 'FINISHED' || round.status === 'CLOSED'
    const isOpenForBets = !isClosed && (round.status === 'OPEN' || round.status === 'SCHEDULED')

    const formattedDate = deadlineDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })

    const predictedMatches = round.matches?.filter((m: any) =>
        m.predictions && m.predictions.some((p: any) => p.userId === currentUserId)
    ) || []

    const hasUserPredicted = predictedMatches.length > 0
    const matchesToShow = round.matches || []
    const showPredictions = matchesToShow.length > 0

    const statusConfig = {
        OPEN: { color: "text-emerald-500", label: "ABERTA", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        SCHEDULED: { color: "text-blue-400", label: "EM BREVE", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        CLOSED: { color: "text-orange-400", label: "EM ANDAMENTO", bg: "bg-orange-500/10", border: "border-orange-500/20" },
        FINISHED: { color: "text-gray-400", label: "FINALIZADA", bg: "bg-gray-500/10", border: "border-gray-500/20" }
    }[isClosed ? 'CLOSED' : (round.status || 'OPEN')] || { color: "text-gray-500", label: "DESCONHECIDO", bg: "bg-gray-500/10", border: "border-white/10" }

    async function handleDelete(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm(`Tem certeza que deseja EXCLUIR a rodada "${round.name}"?\nIsso apagará todos os jogos e palpites dela para sempre.`)) return
        setIsDeleting(true)
        const res = await deleteRoundAction(round.id)
        if (!res.success) {
            alert(res.message)
            setIsDeleting(false)
        }
    }

    if (isDeleting) {
        return (
            <div className="bg-[#121212] border border-red-900/30 rounded-xl p-6 text-center animate-pulse flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <p className="text-red-500 text-sm font-bold uppercase">Deletando rodada...</p>
            </div>
        )
    }

    return (
        <div className={`group relative bg-[#1a1a1a] border rounded-xl overflow-hidden transition-all hover:bg-[#202020] ${statusConfig.border}`}>

            {canManage && (
                <button
                    onClick={handleDelete}
                    className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 text-gray-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-white/5 hover:border-red-500"
                    title="Excluir Rodada"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            <div
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => showPredictions && setIsOpen(!isOpen)}
            >
                {/* INFO */}
                <div className="flex items-start gap-4 flex-1">
                    <div className={`w-1.5 h-12 rounded-full ${isClosed ? 'bg-gray-700' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`} />
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black font-teko uppercase text-white leading-none tracking-wide">
                                {round.name}
                            </h3>
                            {hasUserPredicted && (
                                <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                                    <CheckCircle2 className="w-3 h-3" /> Feito
                                </span>
                            )}
                            {!isOpenForBets && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
                                    {statusConfig.label}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                <span>Encerra: <span className="text-gray-300 font-bold">{formattedDate}</span></span>
                            </div>
                            {round.matches && (
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5 text-gray-600" />
                                    <span>{round.matches.length} Jogos</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTÕES */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {showPredictions && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                            className="h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-bold uppercase transition-all flex items-center gap-2 hover:text-white"
                        >
                            {isOpen ? 'Ocultar' : 'Ver Jogos'}
                            <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                        </button>
                    )}

                    <Link
                        href={`/campeonatos/${slug}/rodada/${round.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 md:flex-none h-10 px-6 rounded-lg flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all ${isOpenForBets ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"}`}
                    >
                        {isOpenForBets ? <><Edit3 className="w-4 h-4" /> Palpitar</> : <><Eye className="w-4 h-4" /> CARTELA</>}
                    </Link>
                </div>
            </div>

            {/* --- LISTA DE RESULTADOS --- */}
            {isOpen && showPredictions && (
                <div className="bg-[#0f0f0f] border-t border-white/5 p-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        {matchesToShow.map((match: any) => {
                            const prediction = match.predictions?.find((p:any) => p.userId === currentUserId)

                            // CORREÇÃO: Ler apenas de homeScore/awayScore
                            const realHome = match.homeScore
                            const realAway = match.awayScore
                            const hasRealScore = realHome !== null && realAway !== null

                            const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === '1H' || match.status === '2H' || match.status === 'HT'
                            const isFinished = match.status === 'FINISHED' || match.status === 'FT' || hasRealScore

                            const matchDate = new Date(match.date)
                            const timeString = matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            const dateString = matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

                            let resultBorder = "border-white/5"
                            let bgClass = "bg-[#161616]"
                            let pointsText = "text-gray-600"
                            let pointsLabel = "--"

                            if (prediction && prediction.isProcessed) {
                                pointsLabel = `+${prediction.pointsEarned}`
                                if (prediction.exactScore) {
                                    resultBorder = "border-yellow-500/50"
                                    bgClass = "bg-yellow-500/5"
                                    pointsText = "text-yellow-400"
                                } else if (prediction.pointsEarned > 0) {
                                    resultBorder = "border-emerald-500/30"
                                    bgClass = "bg-emerald-500/5"
                                    pointsText = "text-emerald-400"
                                } else {
                                    resultBorder = "border-red-500/20"
                                    pointsText = "text-red-500"
                                }
                            }

                            return (
                                <div key={match.id} className={`flex flex-wrap md:flex-nowrap items-center justify-between p-2 rounded-lg border transition-all gap-2 ${bgClass} ${resultBorder}`}>

                                    <div className="flex flex-col items-center justify-center min-w-[40px] border-r border-white/5 mr-1 pr-2 py-1 hidden sm:flex">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase">{dateString}</span>
                                        <span className="text-xs text-white font-mono font-black tracking-tighter">{timeString}</span>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start mb-2 md:mb-0 flex-1 md:flex-none">
                                        <div className="flex flex-col items-center w-10">
                                            {match.homeLogo ? <img src={match.homeLogo} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 bg-gray-800 rounded-full"/>}
                                            <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center mt-1 max-w-[50px]">{match.homeTeam?.substring(0, 3).toUpperCase()}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600">X</span>
                                        <div className="flex flex-col items-center w-10">
                                            {match.awayLogo ? <img src={match.awayLogo} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 bg-gray-800 rounded-full"/>}
                                            <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center mt-1 max-w-[50px]">{match.awayTeam?.substring(0, 3).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-4 flex-1">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Seu</span>
                                            {prediction ? (
                                                <div className="bg-[#0a0a0a] border border-white/10 px-2 py-1 rounded text-white font-mono text-xs font-bold tracking-widest min-w-[60px] text-center shadow-inner flex items-center justify-center gap-1">
                                                    <span>{prediction.homeScore}</span><span className="text-gray-600 text-[10px]">-</span><span>{prediction.awayScore}</span>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-gray-700 font-bold uppercase py-1">---</div>
                                            )}
                                        </div>

                                        {(isLive || isFinished) ? (
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isLive ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>{isLive ? 'Ao Vivo' : 'Real'}</span>
                                                <div className={`px-2 py-1 rounded border font-mono text-xs font-bold tracking-widest min-w-[60px] text-center flex items-center justify-center gap-1 ${isLive ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                                    <span>{realHome ?? '-'}</span><span className="opacity-50 text-[10px]">-</span><span>{realAway ?? '-'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center opacity-30">
                                                <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Real</span>
                                                <div className="text-[10px] font-bold text-gray-500 py-1 px-2 border border-transparent">- x -</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-auto md:w-[15%] flex justify-end pl-2 border-l border-white/5 md:border-none min-w-[50px]">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xl font-black font-teko leading-none ${pointsText}`}>{pointsLabel}</span>
                                            {prediction?.exactScore && <span className="text-[7px] bg-yellow-500 text-black px-1 rounded font-bold uppercase shadow-lg shadow-yellow-500/20">Cravada</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}