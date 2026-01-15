'use client'

import { useState, useEffect } from "react"
import { saveAllPredictionsAction } from "@/actions/save-predictions"
import { updateRoundResultsAction } from "@/actions/update-results-action"
import { getCopyLimit } from "@/utils/rules"

interface PredictionsFormProps {
    round: any
    userId: string
    isClosed: boolean
    isAdmin: boolean
    slug: string
    opponent?: {
        name: string
        teamName: string
        teamLogo?: string | null
        predictions: any[]
    } | null
}

export function PredictionsForm({ round, userId, isClosed, isAdmin, slug, opponent }: PredictionsFormProps) {
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [currentPredictions, setCurrentPredictions] = useState<Record<string, { home: string, away: string }>>({})

    useEffect(() => {
        const initialPredictions: Record<string, { home: string, away: string }> = {}
        round.matches.forEach((match: any) => {
            const userPred = match.predictions.find((p: any) => p.userId === userId)
            if (userPred) {
                initialPredictions[match.id] = {
                    home: String(userPred.homeScore),
                    away: String(userPred.awayScore)
                }
            }
        })
        setCurrentPredictions(initialPredictions)
    }, [round, userId])

    const totalMatches = round.matches.length
    const copyLimit = getCopyLimit(totalMatches)

    const currentCopies = opponent ? round.matches.reduce((count: number, match: any) => {
        const myPred = currentPredictions[match.id]
        const oppPred = opponent.predictions.find((p: any) => p.matchId === match.id)

        if (!myPred || !myPred.home || !myPred.away || !oppPred) return count;

        if (parseInt(myPred.home) === oppPred.homeScore && parseInt(myPred.away) === oppPred.awayScore) {
            return count + 1
        }
        return count
    }, 0) : 0

    const isLimitExceeded = currentCopies > copyLimit

    function handleInputChange(matchId: string, type: 'home' | 'away', value: string) {
        setCurrentPredictions(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId] || { home: '', away: '' },
                [type]: value
            }
        }))
    }

    async function handleUpdateResults() {
        if (!confirm("Isso irá buscar os placares reais na API e atualizar a rodada. Continuar?")) return;
        setUpdating(true)
        const res = await updateRoundResultsAction(round.id, slug)
        setUpdating(false)
        if(res.success) alert("✅ Placares atualizados!")
        else alert("❌ " + res.message)
    }

    async function handleSubmit(formData: FormData) {
        if (isLimitExceeded) {
            setStatusMessage({ type: 'error', text: `⛔ REGRA DE CÓPIA: Limite de ${copyLimit} palpites iguais excedido!` })
            setTimeout(() => setStatusMessage(null), 5000)
            return;
        }

        setLoading(true)
        setStatusMessage(null)
        const res = await saveAllPredictionsAction(formData)
        setLoading(false)

        if (res.success) {
            setStatusMessage({ type: 'success', text: "✅ " + res.message })
            window.location.reload()
        } else {
            setStatusMessage({ type: 'error', text: "❌ " + res.message })
        }
        setTimeout(() => setStatusMessage(null), 3000)
    }

    return (
        <>
            {statusMessage && (
                <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300 ${
                    statusMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                }`}>
                    <p className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                        {statusMessage.type === 'error' ? '⚠️' : '✅'} {statusMessage.text}
                    </p>
                </div>
            )}

            {opponent ? (
                <div className={`border rounded-xl p-5 mb-8 relative overflow-hidden transition-all ${isLimitExceeded ? 'bg-red-500/5 border-red-500/30' : 'bg-gradient-to-r from-[#1a1a1a] via-[#222] to-[#1a1a1a] border-white/10'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-7xl font-black pointer-events-none select-none">VS</div>
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden">
                                {opponent.teamLogo ? (
                                    <img src={opponent.teamLogo} alt={opponent.teamName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-gray-500">{opponent.teamName.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-0.5">Seu Adversário</span>
                                <h2 className="text-xl md:text-2xl font-black font-teko text-white uppercase leading-none">{opponent.teamName}</h2>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">{opponent.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Palpites Iguais</span>
                            <div className={`text-2xl font-black font-teko leading-none ${isLimitExceeded ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                                {currentCopies} <span className="text-gray-600 text-lg">/</span> {copyLimit}
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden relative z-10">
                        <div
                            className={`h-full transition-all duration-500 ${isLimitExceeded ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((currentCopies / copyLimit) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="mb-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-center">
                    <p className="text-blue-400/70 text-[10px] font-bold uppercase tracking-wide">Sem duelo direto nesta rodada.</p>
                </div>
            )}

            {isAdmin && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleUpdateResults}
                        disabled={updating}
                        className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded border border-white/10 flex items-center gap-2 uppercase tracking-wide transition-all"
                    >
                        {updating ? <span className="animate-spin">🔄</span> : "⚡"}
                        {updating ? "Sincronizando..." : "Forçar Atualização de Placares"}
                    </button>
                </div>
            )}

            <form action={handleSubmit} className="pb-24">
                <input type="hidden" name="championshipId" value={round.championship.id} />
                <input type="hidden" name="roundId" value={round.id} />

                <div className="grid gap-3">
                    {round.matches.map((match: any) => {
                        const userPred = match.predictions.find((p: any) => p.userId === userId)
                        const oppPred = opponent?.predictions.find((p: any) => p.matchId === match.id)
                        const matchDate = new Date(match.date)
                        const hasSavedPrediction = !!userPred && userPred.homeScore !== null && userPred.awayScore !== null
                        const isLocked = hasSavedPrediction || isClosed || match.status !== 'SCHEDULED'

                        const currentHome = currentPredictions[match.id]?.home ?? ''
                        const currentAway = currentPredictions[match.id]?.away ?? ''
                        const isCopied = oppPred && parseInt(currentHome) === oppPred.homeScore && parseInt(currentAway) === oppPred.awayScore && currentHome !== '' && currentAway !== ''

                        return (
                            <div key={match.id} className={`border rounded-xl p-4 relative transition-all group ${
                                isLocked
                                    ? 'bg-[#0f0f0f] border-emerald-500/20'
                                    : 'bg-[#121212] border-white/10 hover:border-white/20'
                            }`}>
                                <div className="flex justify-between items-center text-[9px] font-bold uppercase mb-4 tracking-wider border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        {match.status === 'LIVE' ? (
                                            <span className="text-red-500 animate-pulse">● AO VIVO</span>
                                        ) : (
                                            <span className="text-gray-500">
                                                {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' • ' + matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                    {isLocked ? (
                                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            <span className="text-[10px]">✔</span>
                                            <span>Confirmado</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600">Aguardando...</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    {/* MANDANTE */}
                                    <div className="flex-1 flex flex-col items-center gap-2">
                                        {match.homeLogo ? <img src={match.homeLogo} className={`w-10 h-10 object-contain drop-shadow-md ${isLocked ? 'opacity-80' : ''}`} alt={match.homeTeam} /> : <div className="w-10 h-10 bg-gray-800 rounded-full"/>}
                                        <span className={`text-[10px] font-bold text-center leading-tight line-clamp-2 min-h-[2.5em] flex items-center ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>{match.homeTeam}</span>
                                    </div>

                                    {/* ÁREA CENTRAL: INPUTS + VISUALIZAÇÃO DO RIVAL */}
                                    <div className="flex flex-col items-center gap-2 relative z-10">

                                        {/* Placar Real */}
                                        {(match.status === 'FINISHED' || match.status === 'LIVE') && (
                                            <div className="bg-black border border-white/20 px-3 py-0.5 rounded text-sm font-black text-emerald-400 mb-1 shadow-lg">
                                                {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                            </div>
                                        )}

                                        {/* --- AQUI ESTÁ A NOVIDADE: PALPITE DO RIVAL --- */}
                                        {opponent && oppPred && !isLocked && (
                                            <div className="mb-2 flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in">
                                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                                                    Palpite de {opponent.teamName}
                                                </span>
                                                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                                    <span className="text-gray-300 font-mono font-bold text-xs">{oppPred.homeScore}</span>
                                                    <span className="text-gray-600 text-[9px]">-</span>
                                                    <span className="text-gray-300 font-mono font-bold text-xs">{oppPred.awayScore}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* INPUTS (Seus Palpites) */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                name={`home_${match.id}`}
                                                defaultValue={userPred?.homeScore ?? ''}
                                                disabled={isLocked}
                                                onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                                                placeholder="-"
                                                className={`w-12 h-12 rounded-lg text-center text-xl font-bold outline-none transition-all placeholder:text-gray-700 border
                                                    ${isLocked
                                                    ? 'bg-emerald-900/5 border-emerald-500/20 text-emerald-500 cursor-not-allowed'
                                                    : isCopied
                                                        ? 'bg-[#1a1a1a] border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                        : 'bg-[#1a1a1a] border-white/10 text-white focus:border-emerald-500 focus:bg-black'
                                                }
                                                `}
                                            />
                                            <span className="text-gray-600 font-black text-xs">X</span>
                                            <input
                                                type="number"
                                                name={`away_${match.id}`}
                                                defaultValue={userPred?.awayScore ?? ''}
                                                disabled={isLocked}
                                                onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                                                placeholder="-"
                                                className={`w-12 h-12 rounded-lg text-center text-xl font-bold outline-none transition-all placeholder:text-gray-700 border
                                                    ${isLocked
                                                    ? 'bg-emerald-900/5 border-emerald-500/20 text-emerald-500 cursor-not-allowed'
                                                    : isCopied
                                                        ? 'bg-[#1a1a1a] border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                        : 'bg-[#1a1a1a] border-white/10 text-white focus:border-emerald-500 focus:bg-black'
                                                }
                                                `}
                                            />
                                        </div>

                                        {/* Aviso de Cópia */}
                                        {isCopied && !isLocked && (
                                            <span className="absolute -bottom-5 text-[9px] text-yellow-500 font-bold uppercase tracking-wide animate-in fade-in slide-in-from-top-1">
                                                Igual ao Rival
                                            </span>
                                        )}
                                    </div>

                                    {/* VISITANTE */}
                                    <div className="flex-1 flex flex-col items-center gap-2">
                                        {match.awayLogo ? <img src={match.awayLogo} className={`w-10 h-10 object-contain drop-shadow-md ${isLocked ? 'opacity-80' : ''}`} alt={match.awayTeam} /> : <div className="w-10 h-10 bg-gray-800 rounded-full"/>}
                                        <span className={`text-[10px] font-bold text-center leading-tight line-clamp-2 min-h-[2.5em] flex items-center ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>{match.awayTeam}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {!isClosed && (
                    <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-40">
                        <button
                            type="submit"
                            disabled={loading || isLimitExceeded}
                            className={`w-full py-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] font-black text-sm uppercase tracking-widest transition-all transform active:scale-95 flex items-center justify-center gap-3 border ${
                                isLimitExceeded ? 'bg-[#1a1a1a] border-red-500/50 text-red-500 cursor-not-allowed opacity-100' : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                                    Salvando...
                                </>
                            ) : isLimitExceeded ? (
                                <>
                                    <span>🚫</span> Limite Excedido ({currentCopies}/{copyLimit})
                                </>
                            ) : (
                                <>
                                    <span>💾</span> Salvar Palpites
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </>
    )
}