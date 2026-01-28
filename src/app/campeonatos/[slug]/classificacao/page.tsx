import { prisma } from "@/lib/prisma"
import { InternalNavbar } from "@/components/internal-navbar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ClassificacaoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            participants: {
                include: { user: true },
                // Ordena primeiro por GRUPO, depois pelos critérios de desempate
                orderBy: [
                    { group: 'asc' },
                    { groupPoints: 'desc' },
                    { groupWins: 'desc' },
                    { groupSG: 'desc' },
                    { groupGF: 'desc' }
                ]
            }
        }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    // --- LÓGICA DE SEPARAÇÃO ---
    const groupedParticipants = championship.participants.reduce((acc: any, p) => {
        const groupKey = p.group || "GERAL"
        if (!acc[groupKey]) acc[groupKey] = []
        acc[groupKey].push(p)
        return acc
    }, {})

    const groupNames = Object.keys(groupedParticipants).sort()
    const isGroupStage = groupNames.length > 1 && groupNames[0] !== "GERAL"

    return (
        <div className="min-h-screen bg-[#101010] text-gray-100 font-sans pb-20">
            <InternalNavbar />

            <div className="max-w-7xl mx-auto px-2 md:px-4 mt-4 md:mt-8">
                {/* CABEÇALHO */}
                <div className="flex items-center gap-4 mb-6 px-2">
                    <Link href={`/campeonatos/${slug}`} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none text-white">
                            {isGroupStage ? "Fase de Grupos" : "Tabela de Classificação"}
                        </h1>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {championship.name} • Temporada 2026
                        </p>
                    </div>
                </div>

                {/* --- LAYOUT DE GRUPOS (SE TIVER GRUPOS) --- */}
                {isGroupStage ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {groupNames.map((groupName) => (
                            <div key={groupName} className="bg-[#181818] rounded-xl overflow-hidden shadow-lg border border-white/5">
                                {/* HEADER DO GRUPO */}
                                <div className="bg-[#202020] px-3 py-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                        <span className="bg-emerald-500 text-black w-6 h-6 flex items-center justify-center rounded text-xs font-bold">
                                            {groupName}
                                        </span>
                                        GRUPO {groupName}
                                    </h3>

                                    {/* LEGENDA COMPLETA */}
                                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider overflow-x-auto">
                                        <span className="w-6 text-center text-white">PTS</span>
                                        <span className="w-5 text-center">J</span>
                                        <span className="w-5 text-center">V</span>
                                        <span className="w-5 text-center">E</span>
                                        <span className="w-5 text-center">D</span>
                                        <span className="w-5 text-center text-gray-400">GP</span>
                                        <span className="w-5 text-center text-gray-400">GC</span>
                                        <span className="w-6 text-center text-gray-300">SG</span>
                                    </div>
                                </div>

                                {/* LISTA DO GRUPO */}
                                <div className="divide-y divide-white/5">
                                    {groupedParticipants[groupName].map((p: any, index: number) => {
                                        const pos = index + 1
                                        // 2 Primeiros passam (Verde)
                                        const isClassified = pos <= 2
                                        const borderClass = isClassified ? "border-l-[3px] border-emerald-500 bg-emerald-500/5" : "border-l-[3px] border-transparent"

                                        return (
                                            <div key={p.id} className={`flex items-center justify-between px-3 py-3 transition-colors hover:bg-white/5 ${borderClass}`}>

                                                {/* TIME + INFO */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                                    <span className={`text-xs font-bold w-4 text-center ${isClassified ? 'text-emerald-500' : 'text-gray-600'}`}>
                                                        {pos}
                                                    </span>
                                                    <div className="w-8 h-8 flex-shrink-0">
                                                        {p.teamLogo ? (
                                                            <img src={p.teamLogo} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                                                {p.teamName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-sm font-bold text-gray-200 truncate leading-tight">{p.teamName}</span>
                                                        <span className="text-[9px] font-bold text-gray-600 uppercase truncate">{p.user?.name}</span>
                                                    </div>
                                                </div>

                                                {/* ESTATÍSTICAS COMPLETAS (USANDO DADOS DE GRUPO) */}
                                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono font-bold text-gray-500">
                                                    {/* PTS */}
                                                    <span className="w-6 text-center text-white font-black text-sm">{p.groupPoints}</span>
                                                    {/* J */}
                                                    <span className="w-5 text-center text-gray-400">{p.groupPlayed}</span>
                                                    {/* V */}
                                                    <span className="w-5 text-center">{p.groupWins}</span>
                                                    {/* E */}
                                                    <span className="w-5 text-center">{p.groupDraws}</span>
                                                    {/* D */}
                                                    <span className="w-5 text-center">{p.groupLosses}</span>
                                                    {/* GP */}
                                                    <span className="w-5 text-center hidden sm:block">{p.groupGF}</span>
                                                    {/* GC */}
                                                    <span className="w-5 text-center hidden sm:block">{p.groupGC}</span>
                                                    {/* SG */}
                                                    <span className={`w-6 text-center ${p.groupSG > 0 ? 'text-emerald-500' : p.groupSG < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                        {p.groupSG > 0 ? `+${p.groupSG}` : p.groupSG}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* --- LAYOUT DE LIGA ÚNICA (SEM GRUPOS) --- */
                    <div className="bg-[#181818] rounded-lg overflow-hidden shadow-2xl border border-white/5">
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="flex items-center p-3 bg-[#202020] border-b border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <div className="w-10 text-center">#</div>
                                    <div className="flex-1 text-left pl-2">Clube</div>
                                    <div className="w-10 text-center text-white">PTS</div>
                                    <div className="w-10 text-center">J</div>
                                    <div className="w-10 text-center">V</div>
                                    <div className="w-10 text-center">E</div>
                                    <div className="w-10 text-center">D</div>
                                    <div className="w-10 text-center">GP</div>
                                    <div className="w-10 text-center">GC</div>
                                    <div className="w-10 text-center">SG</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {groupedParticipants["GERAL"]?.map((p: any, index: number) => {
                                        const pos = index + 1
                                        return (
                                            <div key={p.id} className="flex items-center py-3 px-3 hover:bg-white/5 transition-colors">
                                                <div className="w-10 text-center font-black text-sm text-gray-500">{pos}</div>
                                                <div className="flex-1 flex items-center gap-3 pl-2">
                                                    {p.teamLogo ? <img src={p.teamLogo} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-800 rounded-full"/>}
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-200">{p.teamName}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">{p.user?.name}</p>
                                                    </div>
                                                </div>
                                                {/* ESTATÍSTICAS GERAIS */}
                                                <div className="w-10 text-center font-black text-white">{p.points}</div>
                                                <div className="w-10 text-center text-xs text-gray-500">{p.matchesPlayed}</div>
                                                <div className="w-10 text-center text-xs text-gray-500">{p.wins}</div>
                                                <div className="w-10 text-center text-xs text-gray-500">{p.draws}</div>
                                                <div className="w-10 text-center text-xs text-gray-500">{p.losses}</div>
                                                <div className="w-10 text-center text-xs text-gray-500">{p.goalsScored}</div>
                                                <div className="w-10 text-center text-xs text-gray-500">{p.goalsConceded}</div>
                                                <div className={`w-10 text-center text-xs font-bold ${p.goalDifference > 0 ? 'text-emerald-500' : p.goalDifference < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                    {p.goalDifference > 0 ? `+${p.goalDifference}` : p.goalDifference}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LEGENDA NO RODAPÉ */}
                <div className="mt-6 flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-t border-white/5 pt-4 px-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Zona de Classificação (Mata-Mata)
                    </div>
                    <div className="ml-auto flex gap-4 opacity-50">
                        <span>GP: Gols Pró</span>
                        <span>GC: Gols Contra</span>
                        <span>SG: Saldo de Gols</span>
                    </div>
                </div>

            </div>
        </div>
    )
}