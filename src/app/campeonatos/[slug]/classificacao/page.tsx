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
                orderBy: [
                    { points: 'desc' },
                    { wins: 'desc' },
                    { goalDifference: 'desc' },
                    { goalsScored: 'desc' }
                ]
            }
        }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    return (
        <div className="min-h-screen bg-[#101010] text-gray-100 font-sans pb-20">
            <InternalNavbar />

            <div className="max-w-6xl mx-auto px-4 mt-8">
                {/* CABEÇALHO */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href={`/campeonatos/${slug}`} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-white">
                            Tabela de Classificação
                        </h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {championship.name} • Temporada 2026
                        </p>
                    </div>
                </div>

                {/* TABELA COM SCROLL HORIZONTAL (EVITA QUEBRA) */}
                <div className="bg-[#181818] rounded-lg overflow-hidden shadow-2xl border border-white/5">
                    <div className="overflow-x-auto">
                        {/* AQUI ESTÁ O SEGREDO: min-w-[800px] garante que a tabela
                           tenha largura suficiente e não esmague as colunas
                        */}
                        <div className="min-w-[800px]">

                            {/* HEADER */}
                            <div className="flex items-center p-3 bg-[#202020] border-b border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                <div className="w-10 text-center">#</div>
                                <div className="flex-1 text-left pl-2">Clube</div>

                                {/* COLUNAS DE ESTATÍSTICAS ALINHADAS */}
                                <div className="w-10 text-center text-white">PTS</div>
                                <div className="w-10 text-center">PJ</div>
                                <div className="w-10 text-center">VIT</div>
                                <div className="w-10 text-center">E</div>
                                <div className="w-10 text-center">DER</div>
                                <div className="w-10 text-center">GM</div>
                                <div className="w-10 text-center">GC</div>
                                <div className="w-10 text-center">SG</div>
                            </div>

                            {/* BODY */}
                            <div className="divide-y divide-white/5">
                                {championship.participants.map((p, index) => {
                                    const pos = index + 1

                                    // Cores da Zona de Classificação
                                    let borderClass = "border-l-[3px] border-transparent"
                                    let posColor = "text-gray-500"

                                    if (pos <= 4) { // G4
                                        borderClass = "border-l-[3px] border-blue-500 bg-blue-500/5"
                                        posColor = "text-white"
                                    } else if (pos > championship.participants.length - 4 && championship.participants.length > 4) { // Z4
                                        borderClass = "border-l-[3px] border-red-500 bg-red-500/5"
                                        posColor = "text-red-400"
                                    }

                                    return (
                                        <div key={p.id} className={`flex items-center py-3 px-3 transition-colors hover:bg-white/5 ${borderClass}`}>

                                            {/* POSIÇÃO */}
                                            <div className={`w-10 text-center font-black text-sm ${posColor}`}>
                                                {pos}
                                            </div>

                                            {/* TIME */}
                                            <div className="flex-1 flex items-center gap-3 pl-2 overflow-hidden">
                                                <div className="w-8 h-8 flex-shrink-0">
                                                    {p.teamLogo ? (
                                                        <img src={p.teamLogo} className="w-full h-full object-contain drop-shadow-md" alt={p.teamName} />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-[#252525] flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white/5">
                                                            {p.teamName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-sm font-bold text-gray-200 truncate leading-tight">{p.teamName}</span>
                                                    <span className="text-[9px] text-gray-600 uppercase font-bold truncate tracking-wide">{p.user?.name}</span>
                                                </div>
                                            </div>

                                            {/* DADOS ESTATÍSTICOS (Largura Fixa para alinhar perfeitamente) */}
                                            <div className="w-10 text-center font-black text-white text-base">{p.points}</div>
                                            <div className="w-10 text-center text-xs font-mono font-bold text-gray-400">{p.matchesPlayed}</div>
                                            <div className="w-10 text-center text-xs font-mono text-gray-500">{p.wins}</div>
                                            <div className="w-10 text-center text-xs font-mono text-gray-500">{p.draws}</div>
                                            <div className="w-10 text-center text-xs font-mono text-gray-500">{p.losses}</div>

                                            {/* GM e GC agora alinhados */}
                                            <div className="w-10 text-center text-xs font-mono text-gray-500">{p.goalsScored}</div>
                                            <div className="w-10 text-center text-xs font-mono text-gray-500">{p.goalsConceded}</div>

                                            {/* SG (Saldo) */}
                                            <div className="w-10 text-center text-xs font-mono font-bold">
                                                <span className={p.goalDifference > 0 ? "text-emerald-500" : p.goalDifference < 0 ? "text-red-500" : "text-gray-500"}>
                                                    {p.goalDifference > 0 ? `+${p.goalDifference}` : p.goalDifference}
                                                </span>
                                            </div>

                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LEGENDAS */}
                <div className="mt-6 flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-blue-500"></span> Zona de Classificação
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-red-500"></span> Rebaixamento
                    </div>

                    <div className="ml-auto hidden md:flex gap-4 opacity-50">
                        <span>GM: Gols Marcados</span>
                        <span>GC: Gols Sofridos</span>
                        <span>SG: Saldo de Gols</span>
                    </div>
                </div>
            </div>
        </div>
    )
}