'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { joinChampionshipAction } from "@/actions/join-championship"
import { searchTeamAction } from "@/actions/search-team-action"
import { Search, Loader2, X, Trophy, Edit2 } from "lucide-react"

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

export function TeamSelector({ teams: initialTeams, championshipId, takenTeams }: TeamSelectorProps) {
    const [currentTeams, setCurrentTeams] = useState<Team[]>(initialTeams)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

    // NOVO: Estado para o nome customizável do time
    const [customTeamName, setCustomTeamName] = useState("")

    const [loading, setLoading] = useState(false)
    const [isSearchingApi, setIsSearchingApi] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [isCustomList, setIsCustomList] = useState(false)

    const router = useRouter()

    // EFEITO: Quando selecionar um time, preenche o nome automaticamente para editar
    useEffect(() => {
        if (selectedTeam) {
            setCustomTeamName(selectedTeam.name)
        }
    }, [selectedTeam])

    async function handleGlobalSearch() {
        if (!searchTerm || searchTerm.length < 3) {
            alert("Digite pelo menos 3 letras para buscar na base global.")
            return
        }

        setIsSearchingApi(true)
        setSelectedTeam(null)
        setCustomTeamName("")

        const res = await searchTeamAction(searchTerm)

        setIsSearchingApi(false)

        if (res.success && res.data.length > 0) {
            setCurrentTeams(res.data)
            setIsCustomList(true)
        } else {
            alert(res.message || "Nenhum time encontrado na base global.")
        }
    }

    function handleClearSearch() {
        setSearchTerm("")
        setCurrentTeams(initialTeams)
        setIsCustomList(false)
        setSelectedTeam(null)
        setCustomTeamName("")
    }

    async function handleConfirm() {
        if (!selectedTeam) return
        if (!customTeamName.trim()) return alert("O nome do time não pode ficar vazio.")

        setLoading(true)

        const formData = new FormData()
        formData.append("championshipId", championshipId)

        // AQUI ESTÁ O PULO DO GATO: Enviamos o nome que você editou, não o original
        formData.append("teamName", customTeamName)

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-36">
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
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-emerald-500 text-black rounded-full p-1 shadow-lg animate-in zoom-in">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                )}

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
                <div className="text-center py-24 bg-white/5 border border-white/5 border-dashed rounded-xl">
                    <p className="text-gray-500 font-medium">Nenhum time encontrado.</p>
                    {isCustomList && (
                        <button onClick={handleClearSearch} className="text-emerald-500 text-sm hover:underline mt-2 font-bold">
                            Voltar para a lista original
                        </button>
                    )}
                </div>
            )}

            {/* --- BARRA FLUTUANTE DE CONFIRMAÇÃO (COM EDIÇÃO DE NOME) --- */}
            <div className={`fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/10 p-4 transition-transform duration-300 z-50 shadow-2xl ${selectedTeam ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">

                    {/* LADO ESQUERDO: ESCUDO + CAMPO DE EDIÇÃO */}
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                        {selectedTeam && (
                            <div className="w-16 h-16 bg-white/5 rounded-lg p-2 border border-white/10 shrink-0">
                                <img src={selectedTeam.logo} className="w-full h-full object-contain" alt="Escudo" />
                            </div>
                        )}

                        <div className="flex flex-col w-full">
                            <label className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                                <Edit2 className="w-3 h-3"/>
                                Nome do seu Time (Editável):
                            </label>
                            <input
                                type="text"
                                value={customTeamName}
                                onChange={(e) => setCustomTeamName(e.target.value)}
                                className="bg-transparent border-b-2 border-white/10 focus:border-emerald-500 text-white text-xl font-black uppercase w-full outline-none transition-colors placeholder:text-gray-700"
                                placeholder="Digite o nome..."
                            />
                        </div>
                    </div>

                    {/* LADO DIREITO: BOTÃO DE AÇÃO */}
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !customTeamName.trim()}
                        className="w-full md:w-auto min-w-[280px] bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 px-8 rounded-xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shrink-0"
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