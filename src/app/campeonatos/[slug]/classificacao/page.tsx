import { prisma } from "@/lib/prisma"
import { InternalNavbar } from "@/components/internal-navbar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
// 1. IMPORT NOVO
import { RankingInterface } from "@/components/ranking-interface"

// 2. DADOS DOS CAMPEÕES DA TEMPORADA (Baseado na sua lista)
const CURRENT_SEASON_CHAMPIONS = [
    { name: "Lucas Ferreira", team: "2 Títulos (BR A, ALE)", titles: 2 },
    { name: "Jefferson", team: "2 Títulos (ITA, HOL)", titles: 2 },
    { name: "Lincoln", team: "1 Título (ING)", titles: 1 },
    { name: "Bruninho", team: "1 Título (ESP)", titles: 1 },
    { name: "Oscar", team: "1 Título (FRA)", titles: 1 },
    { name: "Sulivan", team: "1 Título (POR)", titles: 1 },
]

export default async function ClassificacaoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            participants: {
                include: { user: true }
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

    // --- 3. LÓGICA PARA O RANKING INTERFACE (AO VIVO) ---
    // Ranking Geral por Pontos
    const liveUsers = championship.participants
        .map(p => ({
            id: p.id,
            name: p.user.name,
            globalPoints: p.points
        }))
        .sort((a, b) => b.globalPoints - a.globalPoints)

    // Hall da Fama (Gols na Cartela)
    const liveHallOfFame = championship.participants
        .map(p => ({
            name: p.user.name,
            value: p.goalsScored
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 2) // Top 2

    // --- CONFIGURAÇÃO DO GRID RESPONSIVO ---
    const gridCols = "grid-cols-[20px_1fr_28px_20px_20px_20px_20px_20px_20px_26px] md:grid-cols-[40px_1fr_50px_40px_40px_40px_40px_40px_40px_40px]"

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

                {/* --- LAYOUT DE GRUPOS --- */}
                {isGroupStage ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {groupNames.map((groupName) => {
                            // Ordenação
                            const sortedPlayers = groupedParticipants[groupName].sort((a: any, b: any) => {
                                if (b.groupPoints !== a.groupPoints) return b.groupPoints - a.groupPoints
                                if (b.groupWins !== a.groupWins) return b.groupWins - a.groupWins
                                if (b.groupSG !== a.groupSG) return b.groupSG - a.groupSG
                                if (b.groupGF !== a.groupGF) return b.groupGF - a.groupGF
                                return a.teamName.localeCompare(b.teamName)
                            })

                            return (
                                <div key={groupName} className="bg-[#181818] rounded-xl overflow-hidden shadow-lg border border-white/5">

                                    {/* HEADER DO GRUPO */}
                                    <div className="bg-[#202020] px-3 py-3 border-b border-white/5 flex items-center gap-3">
                                        <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-black text-black shadow-lg
                                            ${groupName === 'A' ? 'bg-emerald-500' :
                                            groupName === 'B' ? 'bg-blue-500' :
                                                groupName === 'C' ? 'bg-indigo-500' :
                                                    groupName === 'D' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                                            {groupName}
                                        </div>
                                        <h3 className="text-white font-black uppercase tracking-widest text-sm">
                                            GRUPO {groupName}
                                        </h3>
                                    </div>

                                    {/* --- TABELA --- */}
                                    <div className="w-full overflow-x-auto no-scrollbar">
                                        <div className="min-w-[320px]">

                                            {/* CABEÇALHO DA TABELA */}
                                            <div className={`grid ${gridCols} gap-1 px-2 py-2 bg-[#1a1a1a] border-b border-white/5 text-[9px] md:text-[10px] text-gray-500 font-bold uppercase text-center items-center`}>
                                                <div>#</div>
                                                <div className="text-left pl-1">Clube</div>
                                                <div className="text-white">PTS</div>
                                                <div>J</div>
                                                <div>V</div>
                                                <div>E</div>
                                                <div>D</div>
                                                <div>GP</div>
                                                <div>GC</div>
                                                <div>SG</div>
                                            </div>

                                            {/* LINHAS */}
                                            <div className="divide-y divide-white/5 text-[10px] md:text-xs">
                                                {sortedPlayers.map((p: any, index: number) => {
                                                    const pos = index + 1
                                                    const isClassified = pos <= 2
                                                    const borderClass = isClassified ? "border-l-[3px] border-emerald-500 bg-emerald-500/5" : "border-l-[3px] border-transparent"

                                                    return (
                                                        <div key={p.id} className={`grid ${gridCols} gap-1 px-2 py-3 items-center text-center transition-colors hover:bg-white/5 ${borderClass}`}>

                                                            {/* POSIÇÃO */}
                                                            <div className={`font-black ${isClassified ? 'text-emerald-500' : 'text-gray-600'}`}>
                                                                {pos}º
                                                            </div>

                                                            {/* TIME + USER */}
                                                            <div className="text-left pl-1 flex flex-col justify-center min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    {p.teamLogo && <img src={p.teamLogo} className="w-4 h-4 md:w-5 md:h-5 object-contain" />}
                                                                    <span className="font-bold text-gray-200 truncate leading-tight">{p.teamName}</span>
                                                                </div>
                                                                <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase truncate max-w-[80px] md:max-w-none">
                                                                    {p.user?.name?.split(' ')[0]}
                                                                </span>
                                                            </div>

                                                            {/* DADOS (USANDO GROUP) */}
                                                            <div className="font-black text-white text-xs md:text-sm bg-white/5 rounded py-0.5">{p.groupPoints || 0}</div>
                                                            <div className="text-gray-400">{p.groupPlayed || 0}</div>
                                                            <div className="text-gray-400">{p.groupWins || 0}</div>
                                                            <div className="text-gray-500">{p.groupDraws || 0}</div>
                                                            <div className="text-gray-500">{p.groupLosses || 0}</div>
                                                            <div className="text-gray-500">{p.groupGF || 0}</div>
                                                            <div className="text-gray-500">{p.groupGC || 0}</div>

                                                            <div className={`font-bold ${(p.groupSG || 0) > 0 ? 'text-emerald-500' : (p.groupSG || 0) < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                                {p.groupSG || 0}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    /* --- LAYOUT DE LIGA ÚNICA (GERAL) --- */
                    <div className="bg-[#181818] rounded-xl overflow-hidden shadow-lg border border-white/5">
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[600px]">
                                <div className={`grid ${gridCols} gap-1 px-3 py-3 bg-[#202020] border-b border-white/5 text-[10px] md:text-[11px] text-gray-500 font-bold uppercase text-center items-center`}>
                                    <div>#</div>
                                    <div className="text-left pl-2">Clube</div>
                                    <div className="text-white">PTS</div>
                                    <div>J</div>
                                    <div>V</div>
                                    <div>E</div>
                                    <div>D</div>
                                    <div>GP</div>
                                    <div>GC</div>
                                    <div>SG</div>
                                </div>
                                <div className="divide-y divide-white/5 text-xs md:text-sm">
                                    {groupedParticipants["GERAL"]?.sort((a: any, b: any) => b.points - a.points || b.wins - a.wins || b.goalDifference - a.goalDifference).map((p: any, index: number) => {
                                        const pos = index + 1
                                        return (
                                            <div key={p.id} className={`grid ${gridCols} gap-1 px-3 py-3 items-center text-center transition-colors hover:bg-white/5`}>
                                                <div className="font-black text-gray-500">{pos}º</div>
                                                <div className="text-left pl-2 flex items-center gap-2">
                                                    {p.teamLogo ? <img src={p.teamLogo} className="w-5 h-5 md:w-6 md:h-6 object-contain" /> : <div className="w-5 h-5 bg-gray-800 rounded-full"/>}
                                                    <div>
                                                        <p className="font-bold text-gray-200">{p.teamName}</p>
                                                        <p className="text-[9px] md:text-[10px] text-gray-500 uppercase">{p.user?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="font-black text-white bg-white/5 rounded py-0.5">{p.points}</div>
                                                <div className="text-gray-400">{p.matchesPlayed}</div>
                                                <div className="text-gray-400">{p.wins}</div>
                                                <div className="text-gray-500">{p.draws}</div>
                                                <div className="text-gray-500">{p.losses}</div>
                                                <div className="text-gray-500">{p.goalsScored}</div>
                                                <div className="text-gray-500">{p.goalsConceded}</div>
                                                <div className={`font-bold ${p.goalDifference > 0 ? 'text-emerald-500' : p.goalDifference < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                    {p.goalDifference}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LEGENDA */}
                <div className="mt-6 flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-t border-white/5 pt-4 px-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Zona de Classificação
                    </div>
                    <div className="ml-auto flex gap-4 opacity-50">
                        <span>PTS: Pontos</span>
                        <span>J: Jogos</span>
                        <span>V: Vitórias</span>
                        <span>SG: Saldo</span>
                    </div>
                </div>

                {/* --- 4. AQUI ENTRA A GALERIA DE LENDAS --- */}
                <div className="mt-16 border-t border-white/5 pt-12">
                    <RankingInterface
                        liveUsers={liveUsers}
                        liveHallOfFame={liveHallOfFame}
                        seasonChampions={CURRENT_SEASON_CHAMPIONS}
                    />
                </div>

            </div>
        </div>
    )
}