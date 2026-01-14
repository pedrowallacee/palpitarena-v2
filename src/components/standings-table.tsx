import { prisma } from "@/lib/prisma"

interface StandingsTableProps {
    championshipId: string
    format: 'POINTS' | 'KNOCKOUT' | 'GROUPS'
}

export async function StandingsTable({ championshipId, format }: StandingsTableProps) {

    // =========================================================
    // MODO 1: MATA-MATA (KNOCKOUT)
    // =========================================================
    if (format === 'KNOCKOUT') {
        const lastRound = await prisma.round.findFirst({
            where: { championshipId },
            orderBy: { createdAt: 'desc' },
            include: {
                duels: {
                    include: {
                        homeParticipant: { include: { user: true } },
                        awayParticipant: { include: { user: true } }
                    }
                }
            }
        })

        if (!lastRound || lastRound.duels.length === 0) {
            return (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-gray-500 text-sm">🔀 Chaves do mata-mata ainda não definidas.</p>
                </div>
            )
        }

        return (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-emerald-500 font-bold text-xs uppercase tracking-widest">{lastRound.name}</h3>
                    <span className="text-[10px] text-gray-500 uppercase">Jogos de Ida/Volta</span>
                </div>

                <div className="space-y-2">
                    {lastRound.duels.map(duel => (
                        <div key={duel.id} className="bg-[#151515] p-4 rounded-xl flex items-center justify-between border border-white/5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-all">

                            {/* Player A */}
                            <div className="flex items-center gap-3 flex-1">
                                {duel.homeParticipant.teamLogo ? (
                                    <img src={duel.homeParticipant.teamLogo} className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-[10px]">⚽</div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold truncate text-white">{duel.homeParticipant.teamName}</span>
                                    <span className="text-[9px] text-gray-500 uppercase">{duel.homeParticipant.user?.name.split(' ')[0]}</span>
                                </div>
                            </div>

                            {/* PLACAR */}
                            <div className="flex items-center gap-2 px-2">
                                <span className="font-teko text-2xl text-emerald-400">{duel.homeScore}</span>
                                <span className="text-gray-700 text-xs px-1">X</span>
                                <span className="font-teko text-2xl text-emerald-400">{duel.awayScore}</span>
                            </div>

                            {/* Player B */}
                            <div className="flex items-center gap-3 flex-1 justify-end text-right">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold truncate text-white">{duel.awayParticipant.teamName}</span>
                                    <span className="text-[9px] text-gray-500 uppercase">{duel.awayParticipant.user?.name.split(' ')[0]}</span>
                                </div>
                                {duel.awayParticipant.teamLogo ? (
                                    <img src={duel.awayParticipant.teamLogo} className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-[10px]">⚽</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // =========================================================
    // BUSCA OS DADOS PARA (PONTOS CORRIDOS) OU (GRUPOS)
    // =========================================================
    const participants = await prisma.championshipParticipant.findMany({
        where: { championshipId },
        orderBy: [
            { points: 'desc' },
            { wins: 'desc' },
            { predictionPoints: 'desc' }
        ],
        include: { user: true }
    })

    // Função auxiliar para desenhar uma tabela
    const renderTable = (data: typeof participants) => (
        <table className="w-full text-left border-collapse">
            <thead>
            <tr className="text-[9px] text-gray-500 uppercase border-b border-white/10 tracking-wider">
                <th className="py-2 pl-2">Pos</th>
                <th className="py-2">Clube</th>
                <th className="py-2 text-center">Pts</th>
                <th className="py-2 text-center">J</th>
                <th className="py-2 text-center">V</th>
            </tr>
            </thead>
            <tbody className="text-sm">
            {data.map((p, i) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className={`py-3 pl-2 font-bold font-teko text-lg w-10 ${
                        i === 0 ? 'text-yellow-400' :
                            i === 1 ? 'text-gray-300' :
                                i === 2 ? 'text-orange-400' : 'text-gray-600'
                    }`}>
                        {i + 1}
                    </td>
                    <td className="py-3">
                        <div className="flex items-center gap-3">
                            {p.teamLogo ? (
                                <img src={p.teamLogo} className="w-8 h-8 object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs">⚽</div>
                            )}
                            <div className="flex flex-col">
                                <span className="font-bold text-white text-xs leading-none mb-1">{p.teamName}</span>
                                <span className="text-[9px] text-gray-500 uppercase">{p.user?.name.split(' ')[0] || "Sem Técnico"}</span>
                            </div>
                        </div>
                    </td>
                    <td className="py-3 text-center font-black text-emerald-400 text-base">{p.points}</td>
                    <td className="py-3 text-center text-gray-400 text-xs font-bold">{p.matchesPlayed}</td>
                    <td className="py-3 text-center text-gray-400 text-xs font-bold">{p.wins}</td>
                </tr>
            ))}
            </tbody>
        </table>
    )

    // =========================================================
    // MODO 2: FASE DE GRUPOS (Separa por Grupo A, B, C...)
    // =========================================================
    if (format === 'GROUPS') {
        // Agrupa os participantes
        const groups: Record<string, typeof participants> = {}

        participants.forEach(p => {
            const groupName = p.group || 'Sem Grupo'
            if (!groups[groupName]) groups[groupName] = []
            groups[groupName].push(p)
        })

        // Se não tiver ninguém com grupo definido ainda
        if (Object.keys(groups).length === 0 || (Object.keys(groups).length === 1 && groups['Sem Grupo'])) {
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                        <p className="text-yellow-500 text-xs font-bold uppercase">⚠️ Sorteio de grupos pendente</p>
                    </div>
                    {/* Mostra tabela geral provisória */}
                    {renderTable(participants)}
                </div>
            )
        }

        // Renderiza várias tabelas (Grupo A, Grupo B...)
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-2">
                {Object.keys(groups).sort().map(groupName => (
                    <div key={groupName} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5">
                        <div className="bg-[#222] px-4 py-2 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-black font-teko text-xl text-white uppercase">GRUPO {groupName}</h3>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Classificação</span>
                        </div>
                        <div className="px-2">
                            {renderTable(groups[groupName])}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // =========================================================
    // MODO 3: PONTOS CORRIDOS (Padrão)
    // =========================================================
    return (
        <div className="overflow-x-auto animate-in fade-in duration-500">
            {participants.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aguardando jogadores...</p>
            ) : (
                renderTable(participants)
            )}
        </div>
    )
}