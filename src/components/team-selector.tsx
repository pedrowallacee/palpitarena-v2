'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { joinChampionshipAction } from "@/actions/join-championship" // Você cria essa action depois

type APITeam = {
    id: number
    name: string
    logo: string
}

type TakenTeam = {
    teamApiId: number | null
    ownerName: string
}

interface TeamSelectorProps {
    championshipId: string
    availableTeams: APITeam[]
    takenTeams: TakenTeam[] // Lista de times já ocupados vinda do banco
}

export function TeamSelector({ championshipId, availableTeams, takenTeams }: TeamSelectorProps) {
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleJoin() {
        if (!selectedTeam) return
        setLoading(true)

        // Encontra os dados do time selecionado
        const teamData = availableTeams.find(t => t.id === selectedTeam)
        if (!teamData) return

        // Chama a Server Action para entrar no campeonato
        // Passamos ID, Nome e Logo para salvar no banco
        const formData = new FormData()
        formData.append("championshipId", championshipId)
        formData.append("teamApiId", teamData.id.toString())
        formData.append("teamName", teamData.name)
        formData.append("teamLogo", teamData.logo)

        await joinChampionshipAction(formData) // Sua action de salvar no banco
        setLoading(false)
        router.refresh()
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {availableTeams.map((team) => {
                    // Lógica: Verifica se este time está na lista de ocupados
                    const isTaken = takenTeams.find(taken => taken.teamApiId === team.id)
                    const isSelected = selectedTeam === team.id

                    return (
                        <div
                            key={team.id}
                            onClick={() => !isTaken && setSelectedTeam(team.id)}
                            className={`
                                relative group rounded-xl p-4 border transition-all duration-300 flex flex-col items-center gap-3
                                ${isTaken
                                ? "bg-[#1a1a1a] border-white/5 cursor-not-allowed opacity-70" // Estilo BLOQUEADO
                                : isSelected
                                    ? "bg-[#a3e635]/10 border-[#a3e635] shadow-[0_0_20px_rgba(163,230,53,0.3)] cursor-pointer scale-105" // Estilo SELECIONADO
                                    : "bg-[#1a1a1a] border-white/10 hover:border-white/30 hover:bg-white/5 cursor-pointer hover:-translate-y-1" // Estilo DISPONÍVEL
                            }
                            `}
                        >
                            {/* LOGO DO TIME */}
                            <img
                                src={team.logo}
                                alt={team.name}
                                className={`
                                    w-20 h-20 object-contain transition-all duration-500
                                    ${isTaken ? "grayscale brightness-50 contrast-125" : ""} 
                                `}
                            />

                            {/* NOME DO TIME */}
                            <span className={`text-sm font-bold text-center leading-tight ${isTaken ? "text-gray-500" : "text-white"}`}>
                                {team.name}
                            </span>

                            {/* OVERLAY: "TAKEN BY PEDRO W." */}
                            {isTaken && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-2 text-center border border-white/10">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Selecionado por</span>
                                    <span className="text-[#a3e635] font-bold font-['Teko'] text-xl leading-none truncate w-full">
                                        {isTaken.ownerName}
                                    </span>
                                </div>
                            )}

                            {/* CHECKBOX DE SELEÇÃO (Só aparece se disponível e selecionado) */}
                            {isSelected && !isTaken && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[#a3e635] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* BOTÃO FLUTUANTE DE CONFIRMAR */}
            <div className="fixed bottom-0 left-0 w-full bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/10 p-4 z-50 flex justify-center">
                <button
                    onClick={handleJoin}
                    disabled={!selectedTeam || loading}
                    className="w-full max-w-md bg-[#a3e635] hover:bg-[#8cc629] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#a3e635]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? "Entrando..." : "CONFIRMAR E ENTRAR NO CAMPEONATO"}
                </button>
            </div>
            <div className="h-24"></div> {/* Espaçamento para o footer */}
        </div>
    )
}