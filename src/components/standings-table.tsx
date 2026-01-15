import { prisma } from "@/lib/prisma"

interface StandingsTableProps {
    championshipId: string
    limit?: number // Opção para mostrar apenas os top 5 (ex: na home)
}

export async function StandingsTable({ championshipId, limit }: StandingsTableProps) {
    const participants = await prisma.championshipParticipant.findMany({
        where: { championshipId },
        orderBy: [
            { points: 'desc' },          // 1. Pontos
            { wins: 'desc' },            // 2. Vitórias
            { goalDifference: 'desc' },  // 3. Saldo de Gols (CORRIGIDO AQUI)
            { goalsScored: 'desc' }      // 4. Gols Pró
        ],
        take: limit, // Se passar limit, pega só os primeiros
        include: { user: true }
    })

    if (participants.length === 0) {
        return <div className="text-gray-500 text-xs p-4">Nenhum participante.</div>
    }

    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-[9px] text-gray-500 uppercase font-bold tracking-widest border-b border-white/5 bg-white/5">
                        <th className="p-3 w-10 text-center">Pos</th>
                        <th className="p-3">Clube</th>
                        <th className="p-3 text-center text-white">PTS</th>
                        <th className="p-3 text-center hidden sm:table-cell">J</th>
                        <th className="p-3 text-center hidden md:table-cell">V</th>
                        <th className="p-3 text-center hidden md:table-cell">E</th>
                        <th className="p-3 text-center hidden md:table-cell">D</th>
                        <th className="p-3 text-center hidden sm:table-cell">SG</th>
                    </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-gray-300">
                    {participants.map((participant, index) => {
                        // Destaques visuais para G4 e Z4 (Exemplo: Top 4 e Bottom 4)
                        // Ajuste conforme a quantidade de participantes
                        let posColor = "text-gray-500"
                        let borderClass = "border-l-2 border-transparent"

                        if (index < 4) { // G4
                            posColor = "text-blue-400"
                            borderClass = "border-l-2 border-blue-500 bg-blue-500/5"
                        } else if (participants.length > 8 && index >= participants.length - 4) { // Z4
                            posColor = "text-red-400"
                            borderClass = "border-l-2 border-red-500 bg-red-500/5"
                        }

                        return (
                            <tr key={participant.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${borderClass}`}>
                                <td className={`p-3 text-center font-black ${posColor}`}>
                                    {index + 1}º
                                </td>
                                <td className="p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                        {participant.teamLogo ? (
                                            <img src={participant.teamLogo} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[8px]">{participant.teamName.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="truncate max-w-[120px] md:max-w-none text-white">{participant.teamName}</span>
                                        <span className="text-[9px] text-gray-500 uppercase font-bold">{participant.user?.name || "Sem Técnico"}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center font-black text-sm text-white bg-white/5">
                                    {participant.points}
                                </td>
                                <td className="p-3 text-center hidden sm:table-cell text-gray-400">{participant.matchesPlayed}</td>
                                <td className="p-3 text-center hidden md:table-cell text-gray-500">{participant.wins}</td>
                                <td className="p-3 text-center hidden md:table-cell text-gray-500">{participant.draws}</td>
                                <td className="p-3 text-center hidden md:table-cell text-gray-500">{participant.losses}</td>
                                <td className="p-3 text-center hidden sm:table-cell font-mono text-gray-400">
                                    {participant.goalDifference > 0 ? `+${participant.goalDifference}` : participant.goalDifference}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>

            {/* Legenda simples */}
            <div className="p-2 flex gap-4 justify-center text-[9px] font-bold uppercase text-gray-600 bg-[#0a0a0a]">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> G4</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-700"></span> Meio</div>
                {participants.length > 8 && <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Z4</div>}
            </div>
        </div>
    )
}