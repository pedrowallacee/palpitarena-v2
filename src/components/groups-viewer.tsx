import { prisma } from "@/lib/prisma"

interface GroupsViewerProps {
    championshipId: string
}

export async function GroupsViewer({ championshipId }: GroupsViewerProps) {
    // 1. Busca participantes JÁ FILTRANDO quem tem grupo
    // E ordena pelos critérios da Fase de Grupos (não do ranking geral)
    const participants = await prisma.championshipParticipant.findMany({
        where: {
            championshipId,
            group: { not: null } // Só traz quem tem grupo definido
        },
        orderBy: [
            { groupPoints: 'desc' },  // 1º Pontos no Grupo
            { groupWins: 'desc' },    // 2º Vitórias no Grupo
            { groupSG: 'desc' },      // 3º Saldo de Gols no Grupo
            { groupGF: 'desc' }       // 4º Gols Pró no Grupo
        ]
    })

    // 2. Agrupa por Letra (A, B, C...)
    const groups: Record<string, typeof participants> = {}

    participants.forEach(p => {
        if (!p.group) return
        if (!groups[p.group]) groups[p.group] = []
        groups[p.group].push(p)
    })

    // 3. Ordena as chaves (A, B, C...)
    const sortedGroupNames = Object.keys(groups).sort()

    if (sortedGroupNames.length === 0) {
        return (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5 animate-in fade-in">
                <p className="text-gray-400 font-bold mb-2">A Fase de Grupos ainda não começou.</p>
                <p className="text-xs text-gray-600">Aguarde o administrador realizar o sorteio.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
            {sortedGroupNames.map(groupName => (
                <div key={groupName} className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col">

                    {/* CABEÇALHO DO GRUPO */}
                    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#222] p-3 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-white font-black font-teko uppercase text-xl tracking-wide flex items-center gap-2">
                            <span className="bg-emerald-500 text-black w-6 h-6 flex items-center justify-center rounded text-sm font-bold">
                                {groupName}
                            </span>
                            Grupo {groupName}
                        </h3>

                        {/* LEGENDA DAS COLUNAS (Fica alinhada com as colunas de baixo) */}
                        <div className="flex gap-0 text-[10px] text-gray-500 font-bold font-mono">
                            <div className="w-8 text-center" title="Pontos">PTS</div>
                            <div className="w-8 text-center" title="Jogos">J</div>
                            <div className="w-8 text-center hidden sm:block" title="Vitórias">V</div>
                            <div className="w-8 text-center hidden sm:block" title="Empates">E</div>
                            <div className="w-8 text-center hidden sm:block" title="Derrotas">D</div>
                            <div className="w-8 text-center" title="Saldo">SG</div>
                        </div>
                    </div>

                    {/* TABELA */}
                    <div className="divide-y divide-white/5 bg-[#0a0a0a]">
                        {groups[groupName].map((participant, index) => {
                            // Regra de Classificação: Os 2 primeiros ficam verdes
                            const isQualified = index < 2

                            return (
                                <div key={participant.id} className={`flex items-center justify-between p-3 hover:bg-white/5 transition-colors ${isQualified ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'}`}>

                                    {/* LADO ESQUERDO: POSIÇÃO + TIME */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className={`w-4 text-center text-xs font-bold font-mono ${isQualified ? 'text-emerald-500' : 'text-gray-600'}`}>
                                            {index + 1}
                                        </span>

                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                                            {participant.teamLogo ? (
                                                <img src={participant.teamLogo} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-500">{participant.teamName.charAt(0)}</span>
                                            )}
                                        </div>

                                        <span className="truncate text-xs md:text-sm font-bold text-gray-200">
                                            {participant.teamName}
                                        </span>
                                    </div>

                                    {/* LADO DIREITO: ESTATÍSTICAS (Usa os campos 'group...') */}
                                    <div className="flex gap-0 text-xs font-mono font-bold text-gray-400">
                                        <div className="w-8 text-center text-white font-black bg-white/5 rounded mx-0.5 flex items-center justify-center">
                                            {participant.groupPoints}
                                        </div>
                                        <div className="w-8 text-center flex items-center justify-center">{participant.groupPlayed}</div>
                                        <div className="w-8 text-center hidden sm:flex items-center justify-center">{participant.groupWins}</div>
                                        <div className="w-8 text-center hidden sm:flex items-center justify-center">{participant.groupDraws}</div>
                                        <div className="w-8 text-center hidden sm:flex items-center justify-center">{participant.groupLosses}</div>
                                        <div className="w-8 text-center flex items-center justify-center text-gray-500">
                                            {participant.groupSG > 0 ? `+${participant.groupSG}` : participant.groupSG}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}