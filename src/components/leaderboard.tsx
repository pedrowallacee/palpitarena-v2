import { Prisma } from "@prisma/client"

// Define o tipo esperando que o 'user' venha junto
type ParticipantData = Prisma.ChampionshipParticipantGetPayload<{
    include: { user: true }
}>

interface LeaderboardProps {
    participants: ParticipantData[]
}

export function Leaderboard({ participants }: LeaderboardProps) {
    // Lógica de Ordenação:
    // 1. Pontos (Decrescente)
    // 2. Vitórias (Decrescente)
    // 3. Nome (Ordem Alfabética)
    const sorted = [...participants].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points

        const winsA = a.wins || 0
        const winsB = b.wins || 0
        if (winsB !== winsA) return winsB - winsA

        const nameA = a.teamName || a.user?.name || "Anônimo"
        const nameB = b.teamName || b.user?.name || "Anônimo"

        return nameA.localeCompare(nameB)
    })

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Cabeçalho da Tabela */}
            <div className="bg-[#222] p-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span className="w-8 text-center">Pos</span>
                <span className="flex-1 ml-4">Treinador / Time</span>
                <div className="flex gap-4 text-center">
                    <span className="w-8" title="Vitórias nos Palpites">🏆</span>
                    <span className="w-10 text-white">PTS</span>
                </div>
            </div>

            {/* Lista de Participantes */}
            <div className="divide-y divide-white/5">
                {sorted.map((p, index) => {
                    const pos = index + 1
                    let rankColor = "text-gray-500 font-mono"
                    let rowBg = "hover:bg-white/5"
                    let trophy = null

                    // Destaque para o Top 3
                    if (pos === 1) {
                        rankColor = "text-yellow-400 font-black text-xl"
                        rowBg = "bg-yellow-400/5 hover:bg-yellow-400/10 border-l-4 border-yellow-400"
                        trophy = "👑"
                    } else if (pos === 2) {
                        rankColor = "text-gray-300 font-black text-lg"
                        trophy = "🥈"
                    } else if (pos === 3) {
                        rankColor = "text-orange-400 font-black text-lg"
                        trophy = "🥉"
                    }

                    return (
                        <div key={p.id} className={`flex items-center p-4 transition-all ${rowBg}`}>
                            {/* Posição */}
                            <div className={`w-8 text-center flex justify-center items-center ${rankColor}`}>
                                {trophy || `${pos}º`}
                            </div>

                            {/* Avatar e Nomes */}
                            <div className="flex-1 flex items-center gap-3 ml-4 min-w-0">
                                <div className="relative flex-shrink-0">
                                    {/* Lógica da Imagem: Prioridade para Logo do Time > Foto do User > Inicial */}
                                    {p.teamLogo ? (
                                        <img
                                            src={p.teamLogo}
                                            className="w-10 h-10 rounded-full border border-white/10 object-contain bg-white/5 p-1"
                                            alt={p.teamName}
                                        />
                                    ) : p.user?.image ? (
                                        <img
                                            src={p.user.image}
                                            className="w-10 h-10 rounded-full border border-white/10 object-cover"
                                            alt={p.user.name}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 border border-white/10">
                                            {p.teamName ? p.teamName.charAt(0) : p.user?.name?.charAt(0) || "?"}
                                        </div>
                                    )}
                                </div>

                                <div className="truncate pr-2">
                                    <p className={`text-sm font-bold truncate ${pos === 1 ? 'text-yellow-400' : 'text-white'}`}>
                                        {p.teamName || "Time Sem Nome"}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide truncate">
                                        {p.user?.name || "Treinador Desconhecido"}
                                    </p>
                                </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="flex gap-4 items-center">
                                <div className="w-8 text-center">
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                        {p.wins || 0}
                                    </span>
                                </div>
                                <div className="w-10 text-center">
                                    <span className="text-lg font-black text-white font-teko tracking-wide">{p.points}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {sorted.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                    Nenhum participante pontuou ainda.
                </div>
            )}
        </div>
    )
}