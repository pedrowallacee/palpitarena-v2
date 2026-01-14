'use client'

import { useState } from "react"
import { saveAllPredictionsAction } from "@/actions/save-predictions"
import { updateRoundResultsAction } from "@/actions/update-results-action"
import { getCopyLimit } from "@/utils/rules" // Importe a função criada acima

interface PredictionsFormProps {
    round: any
    userId: string
    isClosed: boolean
    isAdmin: boolean
    slug: string
    opponent?: { name: string, teamName: string, predictions: any[] } | null // Dados do adversário
}

export function PredictionsForm({ round, userId, isClosed, isAdmin, slug, opponent }: PredictionsFormProps) {
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Estado local para contar cópias em tempo real
    const [currentPredictions, setCurrentPredictions] = useState<Record<string, {home: string, away: string}>>({})

    const totalMatches = round.matches.length
    const copyLimit = getCopyLimit(totalMatches)

    // Calcula quantas cópias existem atualmente
    const currentCopies = opponent ? round.matches.reduce((count: number, match: any) => {
        const myPred = currentPredictions[match.id]
        // Busca palpite do oponente para esse jogo
        const oppPred = opponent.predictions.find((p: any) => p.matchId === match.id)

        // Se eu ainda não preenchi ou o oponente não preencheu, não conta
        if (!myPred || !oppPred) return count;

        // Verifica se é igual (Placar Exato)
        if (parseInt(myPred.home) === oppPred.homeScore && parseInt(myPred.away) === oppPred.awayScore) {
            return count + 1
        }
        return count
    }, 0) : 0

    const isLimitExceeded = currentCopies > copyLimit

    // Atualiza estado local ao digitar
    function handleInputChange(matchId: string, type: 'home' | 'away', value: string) {
        setCurrentPredictions(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [type]: value
            }
        }))
    }

    async function handleUpdateResults() {
        setUpdating(true)
        const res = await updateRoundResultsAction(round.id, slug)
        setUpdating(false)
        alert(res.message)
    }

    async function handleSubmit(formData: FormData) {
        if (isLimitExceeded) {
            setStatusMessage({ type: 'error', text: `⛔ REGRA DE CÓPIA: Você excedeu o limite de ${copyLimit} palpites iguais ao adversário!` })
            setTimeout(() => setStatusMessage(null), 5000)
            return; // BLOQUEIA O ENVIO
        }

        setLoading(true)
        setStatusMessage(null)
        const res = await saveAllPredictionsAction(formData)
        setLoading(false)
        if (res.success) setStatusMessage({ type: 'success', text: "✅ " + res.message })
        else setStatusMessage({ type: 'error', text: "❌ " + res.message })
        setTimeout(() => setStatusMessage(null), 3000)
    }

    return (
        <>
            {/* TOAST DE MENSAGEM */}
            {statusMessage && (
                <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300 ${
                    statusMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'
                }`}>
                    <p className="font-bold text-sm uppercase tracking-wide">{statusMessage.text}</p>
                </div>
            )}

            {/* --- ÁREA DO ADVERSÁRIO (DUELO) --- */}
            {opponent ? (
                <div className="bg-gradient-to-r from-[#1a1a1a] via-[#222] to-[#1a1a1a] border border-white/10 rounded-xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚔️</div>

                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Seu Adversário</span>
                            <h2 className="text-2xl font-black font-teko text-white uppercase">{opponent.teamName}</h2>
                            <p className="text-xs text-gray-500 uppercase">{opponent.name}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">Regra Anti-Cópia</span>
                            <div className={`text-xl font-black font-teko ${isLimitExceeded ? 'text-red-500' : 'text-emerald-400'}`}>
                                {currentCopies} / {copyLimit} <span className="text-sm text-gray-500">Permitidos</span>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Progresso da Cópia */}
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${isLimitExceeded ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((currentCopies / copyLimit) * 100, 100)}%` }}
                        />
                    </div>
                    {isLimitExceeded && <p className="text-red-400 text-[10px] font-bold mt-2 uppercase text-center animate-pulse">⚠️ Mude alguns palpites para poder salvar!</p>}
                </div>
            ) : (
                <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <p className="text-blue-400 text-xs font-bold uppercase">Você não tem duelo direto nesta rodada (Pontos Corridos ou Bye).</p>
                </div>
            )}

            {isAdmin && (
                <div className="flex justify-end mb-4">
                    <button onClick={handleUpdateResults} disabled={updating} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2 uppercase tracking-wide transition-all">
                        {updating ? "Buscando..." : "🔄 Atualizar Placares"}
                    </button>
                </div>
            )}

            <form action={handleSubmit}>
                <input type="hidden" name="championshipId" value={round.championship.id} />
                <input type="hidden" name="roundId" value={round.id} />

                <div className="space-y-4">
                    {round.matches.map((match: any) => {
                        const userPred = match.predictions.find((p: any) => p.userId === userId)
                        // Palpite do adversário
                        const oppPred = opponent?.predictions.find((p: any) => p.matchId === match.id)

                        const matchDate = new Date(match.date)
                        const isMatchLocked = new Date() > matchDate || match.status === 'FINISHED'
                        const scorers = match.details as any[] || []

                        // Verifica se este jogo específico está copiado
                        const currentHome = currentPredictions[match.id]?.home ?? userPred?.homeScore
                        const currentAway = currentPredictions[match.id]?.away ?? userPred?.awayScore
                        const isCopied = oppPred && parseInt(currentHome) === oppPred.homeScore && parseInt(currentAway) === oppPred.awayScore

                        return (
                            <div key={match.id} className={`border rounded-xl p-4 relative transition-all ${isMatchLocked ? 'bg-[#151515] border-white/5 opacity-80' : 'bg-[#1a1a1a] border-white/10'}`}>

                                {/* Header */}
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase mb-3 tracking-wider">
                                    <span>{matchDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} • {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {match.status === 'FINISHED' ? <span className="text-emerald-500">ENCERRADO</span> : <span>{match.leagueName}</span>}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    {/* Casa */}
                                    <div className="flex-1 flex flex-col items-center">
                                        {match.homeLogo && <img src={match.homeLogo} className="w-10 h-10 object-contain" />}
                                        <span className="text-xs font-bold text-center mt-1">{match.homeTeam}</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        {/* Placar Real */}
                                        {(match.status === 'FINISHED' || match.status === 'LIVE') && (
                                            <div className="bg-[#0f0f0f] px-3 py-1 rounded border border-white/10 mb-1">
                                                <span className="text-xl font-black text-emerald-400">{match.homeScore ?? 0} - {match.awayScore ?? 0}</span>
                                            </div>
                                        )}

                                        {/* Inputs */}
                                        <div className="flex items-center gap-3 relative">
                                            <input
                                                type="number"
                                                name={`home_${match.id}`}
                                                defaultValue={userPred?.homeScore ?? ''}
                                                disabled={isClosed || isMatchLocked}
                                                onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                                                className={`w-10 h-10 bg-[#0f0f0f] border rounded-lg text-center text-lg font-bold text-white outline-none ${isCopied ? 'border-yellow-500/50 text-yellow-500' : 'border-white/20'}`}
                                            />
                                            <span className="text-gray-600 font-black text-sm">X</span>
                                            <input
                                                type="number"
                                                name={`away_${match.id}`}
                                                defaultValue={userPred?.awayScore ?? ''}
                                                disabled={isClosed || isMatchLocked}
                                                onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                                                className={`w-10 h-10 bg-[#0f0f0f] border rounded-lg text-center text-lg font-bold text-white outline-none ${isCopied ? 'border-yellow-500/50 text-yellow-500' : 'border-white/20'}`}
                                            />

                                            {/* MOSTRAR PALPITE DO ADVERSÁRIO (FANTASMA) */}
                                            {oppPred && (
                                                <div className="absolute -bottom-6 left-0 right-0 text-center flex justify-center gap-1 opacity-50" title="Palpite do Adversário">
                                                    <span className="text-[10px] bg-gray-700 px-1 rounded text-white font-bold">{oppPred.homeScore}</span>
                                                    <span className="text-[10px] text-gray-500">vs</span>
                                                    <span className="text-[10px] bg-gray-700 px-1 rounded text-white font-bold">{oppPred.awayScore}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Visitante */}
                                    <div className="flex-1 flex flex-col items-center">
                                        {match.awayLogo && <img src={match.awayLogo} className="w-10 h-10 object-contain" />}
                                        <span className="text-xs font-bold text-center mt-1">{match.awayTeam}</span>
                                    </div>
                                </div>

                                {scorers.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-white/5 text-center">
                                        {scorers.map((g: any, i: number) => (
                                            <span key={i} className="text-[9px] text-gray-400 mr-2">⚽ {g.player}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {!isClosed && (
                    <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
                        <button type="submit" disabled={loading || isLimitExceeded} className={`pointer-events-auto w-full max-w-md font-black py-4 rounded-xl shadow-2xl uppercase tracking-widest text-sm md:text-lg transition-all flex items-center justify-center gap-2 ${isLimitExceeded ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30'}`}>
                            {isLimitExceeded ? `⚠️ LIMITE EXCEDIDO (${currentCopies}/${copyLimit})` : loading ? "Salvando..." : "💾 SALVAR PALPITES"}
                        </button>
                    </div>
                )}
            </form>
        </>
    )
}