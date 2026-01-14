import { prisma } from "@/lib/prisma"
import { InternalNavbar } from "@/components/internal-navbar"
import { GlobalRankingList } from "@/components/global-ranking-list"

export default async function RankingPage() {
    // 1. Busca os Usuários ordenados por Pontos Globais (Ranking Principal)
    const users = await prisma.user.findMany({
        orderBy: { globalPoints: 'desc' },
        take: 50, // Pega os top 50
        select: {
            id: true,
            name: true,
            image: true,
            globalPoints: true
        }
    })

    // 2. CÁLCULO DAS ESTATÍSTICAS EXTRAS (Hall da Fama)
    // Para "Gols na Cartela" (Total de gols que o cara palpitou)
    const topScorers = await prisma.prediction.groupBy({
        by: ['userId'],
        _sum: {
            homeScore: true,
            awayScore: true
        },
        orderBy: {
            _sum: {
                homeScore: 'desc'
            }
        },
        take: 3
    })

    // Precisamos buscar os nomes desses artilheiros
    const hallOfFame = await Promise.all(topScorers.map(async (stat) => {
        const user = await prisma.user.findUnique({ where: { id: stat.userId } })
        const totalGoals = (stat._sum.homeScore || 0) + (stat._sum.awayScore || 0)
        return { name: user?.name || "Anônimo", value: totalGoals, label: "Gols Palpitados" }
    }))

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-emerald-500 selection:text-black">
            <InternalNavbar />

            <main className="max-w-3xl mx-auto px-4 py-8">

                {/* TÍTULO */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black italic font-teko uppercase text-white tracking-wide mb-2">
                        <span className="text-yellow-500">☆</span> RANKING GERAL <span className="text-yellow-500">☆</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                        Os maiores lendas do Palpita Arena
                    </p>
                </div>

                {/* LISTA PRINCIPAL */}
                <GlobalRankingList users={users} />

                {/* DIVISÓRIA ESTILOSA */}
                <div className="flex items-center justify-center my-12 opacity-50">
                    <div className="h-px bg-white/20 w-full"></div>
                    <span className="px-4 text-2xl">🏆</span>
                    <div className="h-px bg-white/20 w-full"></div>
                </div>

                {/* --- HALL DA FAMA (ESTATÍSTICAS) --- */}
                <div className="grid gap-8">

                    {/* BLOCO: GOLS NA CARTELA (Dinâmico) */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl grayscale group-hover:grayscale-0 transition-all">⚽</div>

                        <h2 className="text-2xl font-black font-teko uppercase text-white mb-6 border-b border-white/10 pb-2 inline-block px-8">
                            ☆ Gols na Cartela ☆
                        </h2>

                        <div className="flex flex-col gap-3 items-center">
                            {hallOfFame.map((record, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-lg">
                                    <span className="text-2xl">{idx === 0 ? '👑' : '🥈'}</span>
                                    <span className="font-bold text-gray-300 uppercase">{record.name}</span>
                                    <span className="font-black text-emerald-400 font-teko text-2xl">{record.value} ⚽</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BLOCO: MELHOR CAMPANHA (Exemplo Estático - Você pode automatizar depois) */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">📈</div>

                        <h2 className="text-2xl font-black font-teko uppercase text-white mb-6 border-b border-white/10 pb-2 inline-block px-8">
                            ☆ Melhor Campanha ☆
                        </h2>

                        <div className="flex flex-col gap-3 items-center">
                            <div className="flex items-center gap-2 text-lg">
                                <span className="text-2xl">👑</span>
                                <span className="font-bold text-gray-300 uppercase">Italo</span>
                                <span className="font-black text-yellow-500 font-teko text-2xl tracking-widest">6/6/0/0</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-600 uppercase mt-4 font-bold">V / E / D / SG</p>
                    </div>

                </div>
            </main>
        </div>
    )
}