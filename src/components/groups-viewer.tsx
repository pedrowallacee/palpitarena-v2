import { prisma } from "@/lib/prisma"

// Busca os dados do banco (Server Component)
async function getGroupsData(championshipId: string) {
    const participants = await prisma.championshipParticipant.findMany({
        where: { championshipId },
        include: { user: true },
        orderBy: [
            { group: 'asc' },   // Agrupa por A, B, C...
            { points: 'desc' }, // Quem tem mais pontos em cima
            { wins: 'desc' },   // Critério desempate: vitórias
            { predictionPoints: 'desc' } // Critério desempate: saldo de pontos
        ]
    })

    // Agrupa os dados num objeto: { "A": [...users], "B": [...users] }
    const grouped: Record<string, typeof participants> = {}

    participants.forEach(p => {
        if (!p.group) return // Ignora quem não tem grupo
        if (!grouped[p.group]) grouped[p.group] = []
        grouped[p.group].push(p)
    })

    return grouped
}

export async function GroupsViewer({ championshipId }: { championshipId: string }) {
    const groups = await getGroupsData(championshipId)
    const groupKeys = Object.keys(groups).sort()

    if (groupKeys.length === 0) {
        return (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-gray-500">Os grupos ainda não foram sorteados.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupKeys.map(groupLetter => (
                <div key={groupLetter} className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                    {/* Header do Grupo */}
                    <div className="bg-[#0f0f0f] border-b border-white/10 p-3 flex justify-between items-center">
                        <h3 className="text-xl font-bold font-['Teko'] text-[#a3e635]">GRUPO {groupLetter}</h3>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Classificação</span>
                    </div>

                    {/* Tabela */}
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-gray-500 border-b border-white/5">
                            <th className="px-3 py-2 text-left w-10">#</th>
                            <th className="px-3 py-2 text-left">Time</th>
                            <th className="px-3 py-2 text-center" title="Pontos">P</th>
                            <th className="px-3 py-2 text-center" title="Jogos">J</th>
                            <th className="px-3 py-2 text-center" title="Vitórias">V</th>
                            <th className="px-3 py-2 text-center hidden sm:table-cell" title="Saldo de Pontos">SP</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {groups[groupLetter].map((team, index) => {
                            // Zona de Classificação (Top 2 verdes)
                            const isQualified = index < 2

                            return (
                                <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-3 py-3">
                                            <span className={`
                                                flex items-center justify-center w-6 h-6 rounded font-bold text-xs
                                                ${isQualified ? "bg-[#a3e635]/20 text-[#a3e635]" : "text-gray-500"}
                                            `}>
                                                {index + 1}
                                            </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-3">
                                            {team.teamLogo && <img src={team.teamLogo} className="w-8 h-8 object-contain" />}
                                            <div>
                                                <span className="block font-bold text-white leading-tight">{team.teamName}</span>
                                                <span className="text-[10px] text-gray-400 uppercase">{team.user?.name ? team.user.name.split(' ')[0] : "CPU"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center font-bold text-white">{team.points}</td>
                                    <td className="px-3 py-3 text-center text-gray-400">{team.matchesPlayed}</td>
                                    <td className="px-3 py-3 text-center text-gray-400">{team.wins}</td>
                                    <td className="px-3 py-3 text-center text-gray-400 hidden sm:table-cell">{team.predictionPoints}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    )
}