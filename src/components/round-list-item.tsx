'use client'

import { useState } from "react"
import Link from "next/link"
import { deleteRoundAction } from "@/actions/delete-round-action"

interface RoundListItemProps {
    round: any
    slug: string
    canManage?: boolean
}

export function RoundListItem({ round, slug, canManage }: RoundListItemProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Verifica status
    const isClosed = new Date() > new Date(round.deadline) || round.status === 'FINISHED'
    const statusColor = isClosed ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"

    const predictedMatches = round.matches.filter((m: any) => m.predictions.length > 0)
    const hasPredictions = predictedMatches.length > 0

    // Função de Deletar
    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation()
        if (!confirm(`Tem certeza que deseja EXCLUIR a rodada "${round.name}"?\nIsso apagará todos os jogos e palpites dela para sempre.`)) {
            return
        }
        setIsDeleting(true)
        const res = await deleteRoundAction(round.id)
        if (!res.success) {
            alert(res.message)
            setIsDeleting(false)
        }
    }

    if (isDeleting) {
        return (
            <div className="bg-[#121212] border border-red-900/30 rounded-xl p-6 text-center animate-pulse">
                <p className="text-red-500 text-sm font-bold uppercase">🗑️ Deletando rodada...</p>
            </div>
        )
    }

    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20 group relative">

            {/* BOTÃO DE DELETAR */}
            {canManage && (
                <button
                    onClick={handleDelete}
                    className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-gray-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir Rodada"
                >
                    🗑️
                </button>
            )}

            {/* --- CABEÇALHO DO CARD --- */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => hasPredictions && setIsOpen(!isOpen)}>

                {/* Info da Rodada */}
                <div className="flex items-center gap-3">
                    <div className={`w-1 h-12 rounded-full transition-colors ${isClosed ? 'bg-gray-700' : 'bg-emerald-500 group-hover:bg-emerald-400'}`} />
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black font-teko uppercase text-white leading-none tracking-wide">
                                {round.name}
                            </h3>
                            {hasPredictions && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Palpitado</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-500 text-xs">📅</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                Encerra: <span className="text-gray-300">{new Date(round.deadline).toLocaleDateString('pt-BR')}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-2">
                    {hasPredictions && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                            className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase transition-all flex items-center gap-2"
                        >
                            {isOpen ? 'Ocultar' : 'Ver Palpites'}
                            <span className={`transition-transform duration-300 text-[8px] ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                    )}

                    <Link
                        href={`/campeonatos/${slug}/rodada/${round.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`h-9 px-5 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${statusColor}`}
                    >
                        {isClosed ? 'Ranking' : 'Palpitar'}
                    </Link>
                </div>
            </div>

            {/* --- ÁREA EXPANSÍVEL (RESUMO) --- */}
            {isOpen && hasPredictions && (
                <div className="bg-[#0f0f0f] border-t border-white/5 p-2 md:p-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        {predictedMatches.map((match: any) => {
                            const prediction = match.predictions[0]
                            const isLive = match.status === 'LIVE'
                            const isFinished = match.status === 'FINISHED'

                            // Formata Hora e Data
                            const matchDate = new Date(match.date)
                            const timeString = matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            const dateString = matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

                            // Cores do resultado
                            let resultBorder = "border-white/5"
                            let bgClass = "bg-[#161616]"
                            let pointsText = "text-gray-600"

                            if (prediction.isProcessed) {
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

                                    {/* --- COLUNA DE HORÁRIO (NOVA) --- */}
                                    <div className="flex flex-col items-center justify-center min-w-[40px] border-r border-white/5 mr-1 pr-2 py-1">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase">{dateString}</span>
                                        <span className="text-xs text-white font-mono font-black tracking-tighter">{timeString}</span>
                                    </div>

                                    {/* Times */}
                                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-start mb-2 md:mb-0 flex-1 md:flex-none">
                                        <div className="flex flex-col items-center w-8">
                                            {match.homeLogo ? <img src={match.homeLogo} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 bg-gray-800 rounded-full"/>}
                                            <span className="text-[7px] md:text-[8px] font-bold text-gray-400 truncate w-full text-center mt-0.5">{match.homeTeam.substring(0, 3).toUpperCase()}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600">X</span>
                                        <div className="flex flex-col items-center w-8">
                                            {match.awayLogo ? <img src={match.awayLogo} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 bg-gray-800 rounded-full"/>}
                                            <span className="text-[7px] md:text-[8px] font-bold text-gray-400 truncate w-full text-center mt-0.5">{match.awayTeam.substring(0, 3).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Placar */}
                                    <div className="flex items-center justify-center gap-2 md:gap-4 flex-1">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Seu</span>
                                            <div className="bg-[#0a0a0a] border border-white/10 px-2 py-1 rounded text-white font-mono text-xs font-bold tracking-widest min-w-[50px] text-center shadow-inner flex items-center justify-center gap-1">
                                                <span>{prediction.homeScore}</span><span className="text-gray-600 text-[10px]">-</span><span>{prediction.awayScore}</span>
                                            </div>
                                        </div>
                                        {(isLive || isFinished) ? (
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${isLive ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>{isLive ? 'Ao Vivo' : 'Real'}</span>
                                                <div className={`px-2 py-1 rounded border font-mono text-xs font-bold tracking-widest min-w-[50px] text-center flex items-center justify-center gap-1 ${isLive ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                                    <span>{match.homeScore ?? 0}</span><span className="opacity-50 text-[10px]">-</span><span>{match.awayScore ?? 0}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center opacity-30">
                                                <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Real</span>
                                                <div className="text-[10px] font-bold text-gray-500 py-1 px-2 border border-transparent">- x -</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pontos */}
                                    <div className="w-auto md:w-[15%] flex justify-end pl-2 border-l border-white/5 md:border-none">
                                        {prediction.isProcessed ? (
                                            <div className="flex flex-col items-end">
                                                <span className={`text-lg font-black font-teko leading-none ${pointsText}`}>+{prediction.pointsEarned}</span>
                                                {prediction.exactScore && <span className="text-[7px] bg-yellow-500 text-black px-1 rounded font-bold uppercase">Cravada</span>}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-700 font-bold uppercase">--</span>
                                        )}
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