import { prisma } from "@/lib/prisma"
import { InternalNavbar } from "@/components/internal-navbar"
import { RankingInterface } from "@/components/ranking-interface" // Importa o novo componente

export default async function RankingPage() {
    // 1. Busca os Usuários ordenados por Pontos Globais (Ranking Principal)
    const liveUsers = await prisma.user.findMany({
        orderBy: { globalPoints: 'desc' },
        take: 50,
        select: {
            id: true,
            name: true,
            image: true,
            globalPoints: true
        }
    })

    // 2. Cálculo "Gols na Cartela" (Ao Vivo)
    const topScorers = await prisma.prediction.groupBy({
        by: ['userId'],
        _sum: { homeScore: true, awayScore: true },
        orderBy: { _sum: { homeScore: 'desc' } }, // Aproximação
        take: 3
    })

    const liveHallOfFame = await Promise.all(topScorers.map(async (stat) => {
        const user = await prisma.user.findUnique({ where: { id: stat.userId } })
        const totalGoals = (stat._sum.homeScore || 0) + (stat._sum.awayScore || 0)
        return { name: user?.name || "Anônimo", value: totalGoals }
    }))

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-emerald-500 selection:text-black">
            <InternalNavbar />

            {/* O componente visual cuida das abas e da exibição */}
            <RankingInterface liveUsers={liveUsers} liveHallOfFame={liveHallOfFame} />
        </div>
    )
}