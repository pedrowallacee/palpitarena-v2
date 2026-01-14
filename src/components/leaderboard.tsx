'use client'

import { useState } from "react"
import { Prisma } from "@prisma/client"

// Tipo auxiliar para os dados
type ParticipantData = Prisma.ChampionshipParticipantGetPayload<{
    include: { user: true }
}>

interface LeaderboardProps {
    participants: ParticipantData[]
}

export function Leaderboard({ participants }: LeaderboardProps) {
    const [selectedParticipant, setSelectedParticipant] = useState<ParticipantData | null>(null)

    // Ordenação (Pontos > Vitórias > Nome)
    const sorted = [...participants].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        const winsA = a.wins || 0
        const winsB = b.wins || 0
        if (winsB !== winsA) return winsB - winsA
        return (a.teamName || "").localeCompare(b.teamName || "")
    })

    return (
        <>
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans">

                {/* --- CABEÇALHO DA TABELA --- */}
                <div className="bg-[#1a1a1a] flex items-center text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-white/5 py-3 px-2">
                    <div className="w-8 text-center">Pos</div>
                    <div className="flex-1 text-left pl-2">Clube</div>

                    {/* Colunas de Estatísticas */}
                    <div className="flex items-center gap-0 md:gap-2 text-center">
                        <div className="w-8 md:w-10 text-white font-black">PTS</div>
                        <div className="w-6 md:w-8" title="Partidas Jogadas">PJ</div>
                        <div className="w-6 md:w-8 hidden md:block" title="Vitórias">VIT</div>
                        <div className="w-6 md:w-8 hidden md:block" title="Empates">E</div>
                        <div className="w-6 md:w-8 hidden md:block" title="Derrotas">DER</div>
                    </div>
                </div>

                {/* --- LINHAS DA TABELA --- */}
                <div className="divide-y divide-white/5 bg-[#0f0f0f]">
                    {sorted.map((p, index) => {
                        const pos = index + 1

                        // Cores especiais para G4, Z4, etc. (Opcional - Estilo Visual)
                        let posBg = "text-gray-500"
                        let rowBorder = "border-l-2 border-transparent"

                        if (pos === 1) { // Campeão / Libertadores
                            posBg = "text-blue-400 font-black"
                            rowBorder = "border-l-2 border-blue-500 bg-blue-500/5"
                        } else if (pos <= 4) { // G4
                            posBg = "text-blue-300"
                            rowBorder = "border-l-2 border-blue-500/50"
                        } else if (pos > sorted.length - 4 && sorted.length > 5) { // Z4 (Rebaixamento)
                            posBg = "text-red-400"
                            rowBorder = "border-l-2 border-red-500/50"
                        }

                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedParticipant(p)}
                                className={`w-full flex items-center py-3 px-2 transition-colors hover:bg-white/5 text-left group ${rowBorder}`}
                            >
                                {/* Posição */}
                                <div className={`w-8 text-center text-sm ${posBg}`}>
                                    {pos}
                                </div>

                                {/* Time e Escudo */}
                                <div className="flex-1 flex items-center gap-3 pl-2 min-w-0">
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        {p.teamLogo ? (
                                            <img src={p.teamLogo} className="w-full h-full object-contain" alt={p.teamName} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                {p.teamName?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className={`text-xs md:text-sm font-bold truncate ${pos === 1 ? 'text-white' : 'text-gray-300'} group-hover:text-white`}>
                                            {p.teamName}
                                        </span>
                                        <span className="text-[9px] text-gray-600 uppercase font-bold truncate group-hover:text-gray-400">
                                            {p.user?.name || "CPU"}
                                        </span>
                                    </div>
                                </div>

                                {/* Dados Estatísticos */}
                                <div className="flex items-center gap-0 md:gap-2 text-center text-xs font-mono">
                                    <div className="w-8 md:w-10 font-black text-white text-sm">{p.points}</div>
                                    <div className="w-6 md:w-8 text-gray-400">{p.matchesPlayed}</div>

                                    {/* Esconde detalhes em telas muito pequenas pra não quebrar */}
                                    <div className="w-6 md:w-8 text-gray-500 hidden md:block">{p.wins}</div>
                                    <div className="w-6 md:w-8 text-gray-500 hidden md:block">{p.draws}</div>
                                    <div className="w-6 md:w-8 text-gray-500 hidden md:block">{p.losses}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Legenda (Opcional) */}
                <div className="p-2 bg-[#1a1a1a] flex gap-4 justify-center text-[9px] font-bold uppercase text-gray-600 border-t border-white/5">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>G4</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-600 rounded-full"></div>Meio</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Z4</div>
                </div>
            </div>

            {/* --- MODAL DE DETALHES (O MESMO DE ANTES) --- */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedParticipant(null)}>
                    <div className="bg-[#121212] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedParticipant(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-white/20 rounded-full text-white flex items-center justify-center transition-all">✕</button>

                        <div className="h-24 bg-gradient-to-br from-blue-900 via-black to-black relative"></div>

                        <div className="px-6 pb-8 -mt-12 relative text-center">
                            <div className="w-24 h-24 mx-auto rounded-full bg-[#121212] p-1 border-4 border-[#121212] shadow-xl mb-3">
                                {selectedParticipant.teamLogo ? (
                                    <img src={selectedParticipant.teamLogo} className="w-full h-full rounded-full object-contain bg-white/5" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-black text-gray-500">{selectedParticipant.teamName.charAt(0)}</div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black font-teko uppercase text-white leading-none mb-1">{selectedParticipant.teamName}</h2>
                            <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-6">{selectedParticipant.user?.name || "Treinador CPU"}</p>

                            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                                <div className="bg-[#1a1a1a] p-2 rounded-lg border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">Jogos</p>
                                    <p className="text-xl font-bold text-white">{selectedParticipant.matchesPlayed}</p>
                                </div>
                                <div className="bg-[#1a1a1a] p-2 rounded-lg border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">Vitórias</p>
                                    <p className="text-xl font-bold text-emerald-400">{selectedParticipant.wins}</p>
                                </div>
                                <div className="bg-[#1a1a1a] p-2 rounded-lg border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">Pts</p>
                                    <p className="text-xl font-black text-yellow-400">{selectedParticipant.points}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}