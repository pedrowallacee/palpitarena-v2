'use client'

import { Trophy } from "lucide-react"

interface GroupsViewerProps {
    participants: any[]
}

export function GroupsViewer({ participants }: GroupsViewerProps) {
    // 1. Agrupar participantes por Grupo (A, B, C, D...)
    const groups: Record<string, any[]> = {}

    // Filtra e agrupa
    participants.forEach(p => {
        if (!p.group) return
        if (!groups[p.group]) groups[p.group] = []
        groups[p.group].push(p)
    })

    // Ordena as chaves dos grupos (A, B, C...)
    const groupNames = Object.keys(groups).sort()

    if (groupNames.length === 0) {
        return (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-gray-400 font-bold mb-2">A Fase de Grupos ainda não começou.</p>
                <p className="text-xs text-gray-600">Aguarde o sorteio dos grupos.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            {groupNames.map(groupName => {
                // Ordenação FIFA: Pontos > Vitórias > SG > GP > Ordem Alfabética
                const players = groups[groupName].sort((a, b) => {
                    if (b.groupPoints !== a.groupPoints) return b.groupPoints - a.groupPoints
                    if (b.groupWins !== a.groupWins) return b.groupWins - a.groupWins
                    if (b.groupSG !== a.groupSG) return b.groupSG - a.groupSG
                    if (b.groupGF !== a.groupGF) return b.groupGF - a.groupGF
                    return a.teamName.localeCompare(b.teamName)
                })

                return (
                    <div key={groupName} className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col">

                        {/* CABEÇALHO DO GRUPO */}
                        <div className="flex items-center gap-3 bg-[#1a1a1a] p-3 border-b border-white/5">
                            <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs text-black shadow-lg
                                ${groupName === 'A' ? 'bg-emerald-500' :
                                groupName === 'B' ? 'bg-blue-500' :
                                    groupName === 'C' ? 'bg-indigo-500' :
                                        groupName === 'D' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                                {groupName}
                            </div>
                            <h3 className="font-black uppercase text-white tracking-widest text-sm">GRUPO {groupName}</h3>
                        </div>

                        {/* --- TABELA (GRID FIXO) --- */}
                        {/* Define larguras exatas para alinhar cabeçalho e dados perfeitamente */}
                        <div className="w-full text-[10px] md:text-xs">

                            {/* LINHA DE TÍTULOS */}
                            <div className="grid grid-cols-[20px_1fr_28px_20px_20px_20px_20px_20px_20px_24px] gap-1 px-2 py-2 bg-[#161616] text-gray-500 font-bold uppercase text-center border-b border-white/5 items-center">
                                <div>#</div>
                                <div className="text-left pl-1">Clube</div>
                                <div className="text-white">PTS</div>
                                <div>J</div>
                                <div>V</div>
                                <div>E</div>
                                <div>D</div>
                                <div className="hidden sm:block">GP</div>
                                <div className="hidden sm:block">GC</div>
                                <div>SG</div>
                            </div>

                            {/* LINHAS DOS TIMES */}
                            <div className="divide-y divide-white/5">
                                {players.map((p, index) => {
                                    const pos = index + 1
                                    const isClassified = pos <= 2 // Top 2 verde

                                    return (
                                        <div key={p.id} className={`grid grid-cols-[20px_1fr_28px_20px_20px_20px_20px_20px_20px_24px] gap-1 px-2 py-3 items-center text-center transition-colors hover:bg-white/5 
                                            ${isClassified ? 'border-l-2 border-emerald-500 bg-emerald-500/5' : 'border-l-2 border-transparent'}`}>

                                            {/* Posição */}
                                            <div className={`font-black ${isClassified ? 'text-emerald-500' : 'text-gray-600'}`}>
                                                {pos}º
                                            </div>

                                            {/* Time */}
                                            <div className="text-left pl-1 flex flex-col justify-center min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    {p.teamLogo && <img src={p.teamLogo} className="w-4 h-4 object-contain" />}
                                                    <span className="font-bold text-gray-200 truncate">{p.teamName}</span>
                                                </div>
                                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate max-w-[80px] sm:max-w-none">
                                                    {p.user?.name?.split(' ')[0]}
                                                </span>
                                            </div>

                                            {/* ESTATÍSTICAS (Alinhadas pelo Grid) */}
                                            <div className="font-black text-white text-xs bg-white/5 rounded py-0.5">{p.groupPoints || 0}</div>
                                            <div className="text-gray-400">{p.groupPlayed || 0}</div>
                                            <div className="text-gray-400">{p.groupWins || 0}</div>
                                            <div className="text-gray-500">{p.groupDraws || 0}</div>
                                            <div className="text-gray-500">{p.groupLosses || 0}</div>

                                            <div className="text-gray-500 hidden sm:block">{p.groupGF || 0}</div>
                                            <div className="text-gray-500 hidden sm:block">{p.groupGC || 0}</div>

                                            <div className={`font-bold ${(p.groupSG || 0) > 0 ? 'text-emerald-500' : (p.groupSG || 0) < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {p.groupSG || 0}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}