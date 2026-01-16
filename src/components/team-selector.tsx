'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { joinChampionshipAction } from "@/actions/join-championship"
import { searchTeamAction } from "@/actions/search-team-action" // <--- A NOVA ACTION
import { Search, Loader2, X, Trophy } from "lucide-react" // Ícones bonitos

interface Team {
    id: number
    name: string
    logo: string
}

interface TeamSelectorProps {
    teams: Team[] // Times iniciais (da Liga)
    championshipId: string
    takenTeams: Record<number, string> // Times já ocupados
}

export function TeamSelector({ teams: initialTeams, championshipId, takenTeams }: TeamSelectorProps) {
    // Estado da Lista de Times (Pode ser a da Liga ou o Resultado da Busca)
    const [currentTeams, setCurrentTeams] = useState<Team[]>(initialTeams)

    // Estado da Seleção
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [loading, setLoading] = useState(false)
    const [isSearchingApi, setIsSearchingApi] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [isCustomList, setIsCustomList] = useState(false) // Para saber se estamos vendo resultado de busca

    const router = useRouter()

    // --- FUNÇÃO DE BUSCA GLOBAL ---
    async function handleGlobalSearch() {
        if (!searchTerm || searchTerm.length < 3) {
            alert("Digite pelo menos 3 letras para buscar na base global.")
            return
        }

        setIsSearchingApi(true)
        setSelectedTeam(null) // Limpa seleção anterior para evitar bugs

        // Chama a Server Action que criamos
        const res = await searchTeamAction(searchTerm)

        setIsSearchingApi(false)

        if (res.success && res.data.length > 0) {
            setCurrentTeams(res.data) // Substitui a lista visual pelos resultados
            setIsCustomList(true) // Marca que estamos no modo "Busca"
        } else {
            alert(res.message || "Nenhum time encontrado na base global.")
        }
    }

    // --- FUNÇÃO PARA LIMPAR BUSCA (VOLTAR PRA LIGA) ---
    function handleClearSearch() {
        setSearchTerm("")
        setCurrentTeams(initialTeams) // Restaura a lista original
        setIsCustomList(false)
        setSelectedTeam(null)
    }

    // --- FUNÇÃO DE ENTRAR NO CAMPEONATO ---
    async function handleConfirm() {
        if (!selectedTeam) return
        setLoading(true)

        const formData = new FormData()
        formData.append("championshipId", championshipId)
        formData.append("teamName", selectedTeam.name)
        formData.append("teamLogo", selectedTeam.logo)
        formData.append("teamApiId", selectedTeam.id.toString())

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

            {/* --- ÁREA DE BUSCA (GLOBAL) --- */}
            <div className="bg-[#121212] border border-white/10 p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-3 shadow-lg">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Não achou seu time? Busque aqui (Ex: Gama, Íbis, Barcelona...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleGlobalSearch}
                        disabled={isSearchingApi || searchTerm.length < 3}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
                    >
                        {isSearchingApi ? <Loader2 className="w-5 h-5 animate-spin"/> : "Buscar"}
                    </button>

                    {/* Botão de Fechar/Limpar (Só aparece se tiver feito uma busca) */}
                    {isCustomList && (
                        <button
                            onClick={handleClearSearch}
                            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl border border-white/10 transition-all"
                            title="Voltar para os times da liga"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>

            {/* --- CABEÇALHO DA LISTA --- */}
            <div className="flex items-center gap-2 mb-4 px-2">
                {isCustomList ? (
                    <>
                        <Search className="w-4 h-4 text-emerald-500"/>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Resultados da Busca Global</span>
                    </>
                ) : (
                    <>
                        <Trophy className="w-4 h-4 text-gray-500"/>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Times da Liga (Padrão)</span>
                    </>
                )}
            </div>

            {/* --- GRID DE TIMES --- */}
            {currentTeams.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-32">
                    {currentTeams.map(team => {
                        const ownerName = takenTeams[team.id]
                        const isTaken = !!ownerName
                        const isSelected = selectedTeam?.id === team.id

                        return (
                            <div
                                key={team.id}
                                onClick={() => !isTaken && setSelectedTeam(team)}
                                className={`
                                    relative flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200 group
                                    ${isTaken
                                    ? 'bg-[#151515] border-transparent opacity-40 cursor-not-allowed grayscale'
                                    : isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500 scale-105 cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                                        : 'bg-[#1a1a1a] border-white/5 hover:border-white/20 hover:bg-[#252525] cursor-pointer hover:-translate-y-1'
                                }
                                `}
                            >
                                {/* Check de Selecionado */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-emerald-500 text-black rounded-full p-1 shadow-lg animate-in zoom-in">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                )}

                                {/* Badge de Ocupado */}
                                {isTaken && (
                                    <div className="absolute top-2 right-2 bg-gray-800 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-gray-700">
                                        Ocupado
                                    </div>
                                )}

                                <div className="w-20 h-20 mb-4 relative flex items-center justify-center p-1">
                                    <img
                                        src={team.logo}
                                        alt={team.name}
                                        className={`w-full h-full object-contain drop-shadow-md transition-transform duration-300 ${!isTaken ? 'group-hover:scale-110' : ''}`}
                                    />
                                </div>

                                <span className="text-xs font-bold text-center leading-tight truncate w-full text-gray-300 group-hover:text-white">
                                    {team.name}
                                </span>

                                {isTaken && (
                                    <span className="mt-2 text-[10px] text-red-400/80 font-bold uppercase tracking-wider truncate max-w-full">
                                        {ownerName.split(' ')[0]}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                // Estado Vazio (Caso a busca não retorne nada ou a liga esteja vazia)
                <div className="text-center py-24 bg-white/5 border border-white/5 border-dashed rounded-xl">
                    <p className="text-gray-500 font-medium">Nenhum time encontrado.</p>
                    {isCustomList && (
                        <button onClick={handleClearSearch} className="text-emerald-500 text-sm hover:underline mt-2 font-bold">
                            Voltar para a lista original
                        </button>
                    )}
                </div>
            )}

            {/* --- BARRA FLUTUANTE DE CONFIRMAÇÃO --- */}
            <div className={`fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/90 backdrop-blur-xl border-t border-white/10 p-4 transition-transform duration-300 z-50 ${selectedTeam ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-4 hidden md:flex">
                        {selectedTeam && <img src={selectedTeam.logo} className="w-12 h-12 object-contain" alt="Escudo" />}
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">Você escolheu:</span>
                            <span className="text-white text-xl font-black uppercase">{selectedTeam?.name}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full md:w-auto min-w-[300px] bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 px-8 rounded-xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin"/>
                                Entrando em campo...
                            </>
                        ) : (
                            <>
                                CONFIRMAR ESCOLHA ⚽
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}