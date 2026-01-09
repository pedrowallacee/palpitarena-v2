// src/components/betting-list.tsx
'use client'

import { saveBetsAction } from "@/actions/save-bets" // Importe a action criada acima
import { useTransition } from "react"

// Tipagem simplificada do jogo vindo do Prisma
type Match = {
    id: string
    homeTeam: string
    awayTeam: string
    homeTeamLogo?: string
    awayTeamLogo?: string
    date: Date
    bets: { homeTeamScore: number; awayTeamScore: number }[] // Seus palpites anteriores
}

export function BettingList({ matches }: { matches: Match[] }) {
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await saveBetsAction(formData)
            if (result.success) {
                alert("✅ Palpites salvos!") // Depois trocamos por um Toast/Notificação mais bonito
            } else {
                alert("❌ Erro: " + result.message)
            }
        })
    }

    return (
        <form action={handleSubmit} className="relative pb-24"> {/* Padding bottom pro botão não cobrir o ultimo jogo */}

            <div className="space-y-4">
                {matches.map((match) => {
                    const myBet = match.bets[0] // Pega o palpite existente se houver

                    return (
                        <div key={match.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                            <span className="text-xs text-gray-500 font-mono">
                                {new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                            </span>

                            <div className="flex items-center justify-between w-full max-w-md gap-4">
                                {/* Time Casa */}
                                <div className="flex-1 flex flex-col items-center gap-2">
                                    {match.homeTeamLogo && <img src={match.homeTeamLogo} className="w-8 h-8 md:w-12 md:h-12 object-contain" />}
                                    <span className="text-sm md:text-base font-bold text-center leading-tight">{match.homeTeam}</span>
                                </div>

                                {/* Inputs de Placar */}
                                <div className="flex items-center gap-2 md:gap-4 bg-black/20 p-2 rounded-lg">
                                    <input
                                        type="number"
                                        name={`home_${match.id}`} // O NOME É IMPORTANTE PARA A ACTION
                                        defaultValue={myBet?.homeTeamScore}
                                        placeholder="-"
                                        className="w-12 h-10 md:w-14 md:h-12 bg-[#0f0f0f] border border-white/20 rounded text-center text-xl font-bold focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                                    />
                                    <span className="text-gray-500 font-bold">X</span>
                                    <input
                                        type="number"
                                        name={`away_${match.id}`} // O NOME É IMPORTANTE PARA A ACTION
                                        defaultValue={myBet?.awayTeamScore}
                                        placeholder="-"
                                        className="w-12 h-10 md:w-14 md:h-12 bg-[#0f0f0f] border border-white/20 rounded text-center text-xl font-bold focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635]"
                                    />
                                </div>

                                {/* Time Fora */}
                                <div className="flex-1 flex flex-col items-center gap-2">
                                    {match.awayTeamLogo && <img src={match.awayTeamLogo} className="w-8 h-8 md:w-12 md:h-12 object-contain" />}
                                    <span className="text-sm md:text-base font-bold text-center leading-tight">{match.awayTeam}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* BOTÃO FLUTUANTE DE SALVAR (FIXO EM BAIXO) */}
            <div className="fixed bottom-0 left-0 w-full bg-[#0f0f0f]/90 backdrop-blur-md border-t border-white/10 p-4 z-50 flex justify-center">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full max-w-md bg-[#a3e635] hover:bg-[#8cc629] text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#a3e635]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                        </>
                    ) : (
                        "SALVAR TODOS OS PALPITES"
                    )}
                </button>
            </div>

        </form>
    )
}