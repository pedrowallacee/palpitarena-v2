'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { joinChampionshipAction } from "@/actions/join-championship"

interface Team {
    id: number
    name: string
    logo: string
}

interface TeamSelectorProps {
    teams: Team[]
    championshipId: string
    takenTeams: Record<number, string>
}

export function TeamSelector({ teams, championshipId, takenTeams }: TeamSelectorProps) {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    async function handleConfirm() {
        if (!selectedTeam) return
        setLoading(true)

        const formData = new FormData()
        formData.append("championshipId", championshipId)
        formData.append("teamName", selectedTeam.name)
        formData.append("teamLogo", selectedTeam.logo)
        formData.append("teamApiId", selectedTeam.id.toString())

        // CHAMADA DA ACTION 👇
        const res = await joinChampionshipAction(formData)

        if (res.success && res.redirectUrl) {
            router.push(res.redirectUrl)
        } else {
            alert(res.message)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* ... resto do código igual ao anterior ... */}

            {/* Só para garantir que você tenha a parte visual atualizada, vou colocar o input e grid resumidos: */}
            <div className="mb-8">
                <input
                    type="text"
                    placeholder="Buscar time..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-24">
                {filteredTeams.map(team => {
                    const ownerName = takenTeams[team.id]
                    const isTaken = !!ownerName
                    const isSelected = selectedTeam?.id === team.id

                    return (
                        <div
                            key={team.id}
                            onClick={() => !isTaken && setSelectedTeam(team)}
                            className={`
                                relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 group
                                ${isTaken
                                ? 'bg-[#151515] border-transparent opacity-50 cursor-not-allowed grayscale'
                                : isSelected
                                    ? 'bg-emerald-500/10 border-emerald-500 scale-105 cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                                    : 'bg-[#1a1a1a] border-white/5 hover:border-white/20 hover:bg-[#252525] cursor-pointer'
                            }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-emerald-500 text-black rounded-full p-1 shadow-lg">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            )}

                            {isTaken && (
                                <div className="absolute top-2 right-2 bg-gray-700 text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    Ocupado
                                </div>
                            )}

                            <img src={team.logo} alt={team.name} className={`w-16 h-16 object-contain mb-3 drop-shadow-lg ${isTaken ? 'opacity-70' : ''}`} />
                            <span className="text-xs font-bold text-center leading-tight truncate w-full">{team.name}</span>
                            {isTaken && (
                                <span className="mt-2 text-[10px] text-red-400 font-bold uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded border border-red-500/10 truncate max-w-full">
                                    {ownerName.split(' ')[0]}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className={`fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/90 backdrop-blur-md border-t border-white/10 p-4 transition-transform duration-300 z-50 ${selectedTeam ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-4xl mx-auto flex items-center justify-center">
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full max-w-md bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-widest text-lg shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Entrando em campo..." : `JOGAR COM ${selectedTeam?.name.toUpperCase()}`}
                    </button>
                </div>
            </div>
        </div>
    )
}