'use client'

import { saveBetsAction } from "@/actions/save-bets"
import { useTransition } from "react"

// Tipagem atualizada conforme o novo Schema
type Match = {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo?: string | null
    awayLogo?: string | null
    date: Date
    // Agora é predictions, não bets
    predictions: { homeScore: number; awayScore: number }[]
}

export function BettingList({ matches }: { matches: Match[] }) {
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await saveBetsAction(formData)
            if (result.success) {
                alert("✅ " + result.message)
            } else {
                alert("❌ " + result.message)
            }
        })
    }

    return (
        <form action={handleSubmit} className="relative pb-24">

            <div className="space-y-4">
                {matches.map((match) => {
                    const myBet = match.predictions[0] // Pega o palpite existente

                    return (
                        <div key={match.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                            <span className="text-xs text-gray-500 font-mono">
                                {new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                            </span>

                            <div className="flex items-center justify-between w-full max-w-md gap-4">
                                {/* Time Casa */}
                                <div className="flex-1 flex flex-col items-center gap-2">
                                    {match.homeLogo && <img src={match.homeLogo} className="w-8 h-8 md:w-12 md:h-12 object-contain" alt={match.homeTeam} />}
                                    <span className="text-sm md:text-base font-bold text-center leading-tight text-white">{match.homeTeam}</span>
                                </div>

                                {/* Inputs de Placar */}
                                <div className="flex items-center gap-2 md:gap-4 bg-black/20 p-2 rounded-lg">
                                    <input
                                        type="number"
                                        name={`home_${match.id}`}
                                        defaultValue={myBet?.homeScore} // Nome novo
                                        placeholder="-"
                                        className="w-12 h-10 md:w-14 md:h-12 bg-[#0f0f0f] border border-white/20 rounded text-center text-xl font-bold text-white focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                                    />
                                    <span className="text-gray-500 font-bold">X</span>
                                    <input
                                        type="number"
                                        name={`away_${match.id}`}
                                        defaultValue={myBet?.awayScore} // Nome novo
                                        placeholder="-"
                                        className="w-12 h-10 md:w-14 md:h-12 bg-[#0f0f0f] border border-white/20 rounded text-center text-xl font-bold text-white focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                                    />
                                </div>

                                {/* Time Fora */}
                                <div className="flex-1 flex flex-col items-center gap-2">
                                    {match.awayLogo && <img src={match.awayLogo} className="w-8 h-8 md:w-12 md:h-12 object-contain" alt={match.awayTeam} />}
                                    <span className="text-sm md:text-base font-bold text-center leading-tight text-white">{match.awayTeam}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* BOTÃO FLUTUANTE */}
            <div className="fixed bottom-0 left-0 w-full bg-[#0f0f0f]/90 backdrop-blur-md border-t border-white/10 p-4 z-50 flex justify-center">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full max-w-md bg-[#a3e635] hover:bg-[#8cc629] text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#a3e635]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {isPending ? "Salvando..." : "SALVAR TODOS OS PALPITES"}
                </button>
            </div>

        </form>
    )
}