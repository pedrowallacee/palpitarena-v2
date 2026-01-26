'use client'

import { saveBetsAction } from "@/actions/save-bets"
import { useTransition } from "react"
import { CheckCircle2 } from "lucide-react" // Ícone opcional, se não tiver pode tirar

// 1. ATUALIZAMOS A TIPAGEM PARA INCLUIR O PLACAR REAL
type Match = {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo?: string | null
    awayLogo?: string | null
    date: Date

    // --- Novos campos do Placar Oficial ---
    resultHome?: number | null
    resultAway?: number | null
    status?: string
    // -------------------------------------

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
                    const myBet = match.predictions[0] // Palpite do usuário

                    // Verifica se o jogo JÁ TEM RESULTADO OFICIAL
                    const hasResult = match.resultHome !== null && match.resultHome !== undefined;

                    return (
                        <div key={match.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3 relative overflow-hidden">

                            {/* SE TIVER RESULTADO, MOSTRA UMA FAIXA OU BADGE */}
                            {hasResult && (
                                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Encerrado
                                </div>
                            )}

                            <span className="text-xs text-gray-500 font-mono">
                                {new Date(match.date).toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                            </span>

                            {/* SEÇÃO DO PLACAR REAL (SÓ APARECE SE TIVER RESULTADO) */}
                            {hasResult && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-1 mb-1">
                                    <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">
                                        Placar Oficial: <span className="text-white text-sm ml-1">{match.resultHome} x {match.resultAway}</span>
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between w-full max-w-md gap-4">
                                {/* Time Casa */}
                                <div className="flex-1 flex flex-col items-center gap-2">
                                    {match.homeLogo && <img src={match.homeLogo} className="w-8 h-8 md:w-12 md:h-12 object-contain" alt={match.homeTeam} />}
                                    <span className="text-sm md:text-base font-bold text-center leading-tight text-white">{match.homeTeam}</span>
                                </div>

                                {/* Inputs de Palpite (Se tiver resultado, fica DESABILITADO) */}
                                <div className={`flex items-center gap-2 md:gap-4 p-2 rounded-lg ${hasResult ? 'opacity-50 grayscale' : 'bg-black/20'}`}>
                                    <input
                                        type="number"
                                        name={`home_${match.id}`}
                                        defaultValue={myBet?.homeScore}
                                        placeholder="-"
                                        disabled={hasResult} // Bloqueia se já acabou
                                        className="w-12 h-10 md:w-14 md:h-12 bg-[#0f0f0f] border border-white/20 rounded text-center text-xl font-bold text-white focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635] disabled:cursor-not-allowed"
                                    />
                                    <span className="text-gray-500 font-bold">X</span>
                                    <input
                                        type="number"
                                        name={`away_${match.id}`}
                                        defaultValue={myBet?.awayScore}
                                        placeholder="-"
                                        disabled={hasResult} // Bloqueia se já acabou
                                        className="w-12 h-10 md:w-14 md:h-12 bg-[#0f0f0f] border border-white/20 rounded text-center text-xl font-bold text-white focus:border-[#a3e635] focus:outline-none focus:ring-1 focus:ring-[#a3e635] disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* Time Fora */}
                                <div className="flex-1 flex flex-col items-center gap-2">
                                    {match.awayLogo && <img src={match.awayLogo} className="w-8 h-8 md:w-12 md:h-12 object-contain" alt={match.awayTeam} />}
                                    <span className="text-sm md:text-base font-bold text-center leading-tight text-white">{match.awayTeam}</span>
                                </div>
                            </div>

                            {hasResult && (
                                <span className="text-[10px] text-gray-500 mt-[-5px]">
                                    (Seu palpite: {myBet?.homeScore ?? '-'} x {myBet?.awayScore ?? '-'})
                                </span>
                            )}
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