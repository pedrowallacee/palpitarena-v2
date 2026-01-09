'use client'

import { useState } from "react"
// Se você ainda não tem o savePrediction, precisará criá-lo.
// Por enquanto, vou comentar para não quebrar o build se não existir.
// import { savePrediction } from "@/actions/save-prediction-action"

interface MatchCardProps {
    match: {
        id: string
        homeTeam: string
        awayTeam: string
        homeLogo: string | null
        awayLogo: string | null
        date: Date
        location: string | null
        status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED"
        homeScore: number | null
        awayScore: number | null
    }
    prediction: {
        homeScore: number
        awayScore: number
        pointsEarned?: number | null
    } | null | undefined
    slug: string
    roundId: string
}

export function MatchCard({ match, prediction, slug, roundId }: MatchCardProps) {
    const [homeScore, setHomeScore] = useState(prediction?.homeScore?.toString() ?? "")
    const [awayScore, setAwayScore] = useState(prediction?.awayScore?.toString() ?? "")
    const [status, setStatus] = useState<"idle" | "saving" | "success">("idle")

    const isLocked = match.status !== 'SCHEDULED'
    const hasPrediction = homeScore !== "" && awayScore !== ""

    async function handleSave() {
        if (homeScore === "" || awayScore === "" || isLocked) return
        setStatus("saving")
        // await savePrediction(match.id, Number(homeScore), Number(awayScore), slug, roundId)
        console.log("Salvar:", homeScore, awayScore) // Placeholder temporário
        setStatus("success")
        setTimeout(() => setStatus("idle"), 2000)
    }

    // --- RENDERIZAÇÃO CONDICIONAL ---

    // CENÁRIO A: Jogo Rolando ou Acabou (Modo Placar)
    if (match.status === 'LIVE' || match.status === 'FINISHED') {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden group hover:border-white/20 transition-all">

                {/* Status Badge */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-b-lg border-b border-x border-white/5 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                    {match.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    {match.status === 'LIVE' ? 'EM ANDAMENTO' : 'ENCERRADO'}
                </div>

                <div className="flex items-center justify-between mt-4">

                    {/* TIME CASA */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <img src={match.homeLogo || ""} className="w-12 h-12 object-contain drop-shadow-md" />
                        <span className="font-bold text-sm text-center leading-tight">{match.homeTeam}</span>
                    </div>

                    {/* PLACAR GIGANTE */}
                    <div className="px-6 flex flex-col items-center">
                        <div className="text-4xl font-black text-white tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </div>

                        {/* O Palpite do Usuário aparece aqui embaixo */}
                        <div className="mt-2 flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Seu Palpite</span>
                            {hasPrediction ? (
                                <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                    <span className="font-mono font-bold text-gray-300">{homeScore} - {awayScore}</span>

                                    {/* CORREÇÃO DO ERRO DE TYPE: Verificação segura de pointsEarned */}
                                    {match.status === 'FINISHED' && prediction?.pointsEarned != null && (
                                        <span className={`text-[10px] font-black px-1.5 rounded ${(prediction.pointsEarned ?? 0) > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                            +{(prediction.pointsEarned ?? 0)}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-xs text-red-400 font-bold italic">Não palpitou</span>
                            )}
                        </div>
                    </div>

                    {/* TIME FORA */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <img src={match.awayLogo || ""} className="w-12 h-12 object-contain drop-shadow-md" />
                        <span className="font-bold text-sm text-center leading-tight">{match.awayTeam}</span>
                    </div>
                </div>
            </div>
        )
    }

    // CENÁRIO B: Jogo Agendado (Modo Aposta)
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-emerald-500/30 transition-all group relative">

            {/* Data e Hora */}
            <div className="absolute top-2 left-3 md:static md:w-24 text-left">
                <div className="text-xs text-emerald-400 font-bold">
                    {new Date(match.date).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                </div>
                <div className="text-lg font-black italic text-white/80">
                    {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Área Central de Aposta */}
            <div className="flex-1 flex items-center justify-center gap-4 w-full mt-4 md:mt-0">
                {/* Casa */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="font-bold text-sm hidden md:block text-right">{match.homeTeam}</span>
                    <img src={match.homeLogo || ""} className="w-10 h-10 object-contain" />
                </div>

                {/* Inputs */}
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        placeholder="0"
                        className="w-12 h-12 text-center bg-black/40 border border-white/10 rounded-lg font-black text-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-white/10"
                    />
                    <span className="text-gray-600 font-black">X</span>
                    <input
                        type="number"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        placeholder="0"
                        className="w-12 h-12 text-center bg-black/40 border border-white/10 rounded-lg font-black text-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-white/10"
                    />
                </div>

                {/* Fora */}
                <div className="flex items-center gap-3 flex-1 justify-start">
                    <img src={match.awayLogo || ""} className="w-10 h-10 object-contain" />
                    <span className="font-bold text-sm hidden md:block text-left">{match.awayTeam}</span>
                </div>
            </div>

            {/* Botão de Salvar */}
            <div className="w-full md:w-auto flex justify-center md:justify-end mt-2 md:mt-0">
                <button
                    onClick={handleSave}
                    disabled={status === 'saving'}
                    className={`
            h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-lg
            ${status === 'success'
                        ? 'bg-emerald-500 text-black translate-y-0.5 shadow-none'
                        : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
                    }
          `}
                >
                    {status === 'saving' ? '...' : status === 'success' ? 'SALVO!' : 'SALVAR'}
                </button>
            </div>
        </div>
    )
}