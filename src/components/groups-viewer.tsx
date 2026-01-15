import { prisma } from "@/lib/prisma"

interface GroupsViewerProps {
    championshipId: string
}

export async function GroupsViewer({ championshipId }: GroupsViewerProps) {
    // Busca participantes ordenados pela REGRA DA LIGA
    const participants = await prisma.championshipParticipant.findMany({
        where: { championshipId },
        orderBy: [
            { points: 'desc' },          // 1º Pontos (3, 1, 0)
            { wins: 'desc' },            // 2º Número de Vitórias
            { goalDifference: 'desc' },  // 3º Saldo de Pontos (SG) - SUBSTITUI O ANTIGO predictionPoints
            { goalsScored: 'desc' }      // 4º Pontos Feitos (GP)
        ]
    })

    // Agrupa por Grupo (A, B, C...)
    const groups: Record<string, typeof participants> = {}

    participants.forEach(p => {
        const groupName = p.group || "Geral"
        if (!groups[groupName]) groups[groupName] = []
        groups[groupName].push(p)
    })

    // Ordena os nomes dos grupos (Grupo A, Grupo B...)
    const sortedGroupNames = Object.keys(groups).sort()

    if (sortedGroupNames.length === 0) {
        return (
            <div className="p-8 text-center border border-white/10 rounded-xl bg-white/5">
                <p className="text-gray-500 text-sm font-bold uppercase">Nenhum grupo definido.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {sortedGroupNames.map(groupName => (
                <div key={groupName} className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 p-3 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-emerald-500 font-black font-teko uppercase text-xl tracking-wide">
                            Grupo {groupName}
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="text-[9px] text-gray-500 uppercase font-bold tracking-widest border-b border-white/5">
                                <th className="p-3">Clube</th>
                                <th className="p-3 text-center" title="Pontos">PTS</th>
                                <th className="p-3 text-center" title="Jogos">J</th>
                                <th className="p-3 text-center hidden md:table-cell" title="Vitórias">V</th>
                                <th className="p-3 text-center hidden md:table-cell" title="Empates">E</th>
                                <th className="p-3 text-center hidden md:table-cell" title="Derrotas">D</th>
                                <th className="p-3 text-center hidden sm:table-cell" title="Saldo">SG</th>
                            </tr>
                            </thead>
                            <tbody className="text-xs font-bold text-gray-300">
                            {groups[groupName].map((participant, index) => {
                                // Zona de Classificação (Exemplo: Top 2 verdes, resto cinza)
                                // Você pode ajustar essa lógica conforme as regras do seu campeonato
                                const isQualified = index < 2

                                return (
                                    <tr key={participant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 flex items-center gap-3">
                                                <span className={`w-4 text-center text-[10px] ${isQualified ? 'text-emerald-500' : 'text-gray-600'}`}>
                                                    {index + 1}º
                                                </span>
                                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10">
                                                {participant.teamLogo ? (
                                                    <img src={participant.teamLogo} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[8px]">{participant.teamName.charAt(0)}</span>
                                                )}
                                            </div>
                                            <span className="truncate max-w-[120px] md:max-w-none">{participant.teamName}</span>
                                        </td>
                                        <td className="p-3 text-center font-black text-white text-sm bg-white/5">
                                            {participant.points}
                                        </td>
                                        <td className="p-3 text-center text-gray-400">{participant.matchesPlayed}</td>
                                        <td className="p-3 text-center hidden md:table-cell text-gray-500">{participant.wins}</td>
                                        <td className="p-3 text-center hidden md:table-cell text-gray-500">{participant.draws}</td>
                                        <td className="p-3 text-center hidden md:table-cell text-gray-500">{participant.losses}</td>
                                        <td className="p-3 text-center hidden sm:table-cell text-gray-400">
                                            {participant.goalDifference > 0 ? `+${participant.goalDifference}` : participant.goalDifference}
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    )
}