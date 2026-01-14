import { prisma} from "@/lib/prisma";

export async function GlobalRankingWidget() {
    // Busca os Top 5 usuários do site todo
    const topUsers = await prisma.user.findMany({
        orderBy: { globalPoints: 'desc' },
        take: 5,
        select: { id: true, name: true, globalPoints: true, titles: true }
    })

    return (
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden group">
            {/* Efeito Dourado */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-[60px] pointer-events-none" />

            <h3 className="text-xl font-black italic font-teko uppercase text-white mb-4 flex items-center gap-2">
                <span className="text-yellow-400 text-2xl">🏆</span> Ranking Global
            </h3>

            <div className="space-y-3 relative z-10">
                {topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded font-black text-xs ${
                                index === 0 ? 'bg-yellow-500 text-black' :
                                    index === 1 ? 'bg-gray-400 text-black' :
                                        index === 2 ? 'bg-orange-700 text-white' : 'bg-white/10 text-gray-500'
                            }`}>
                                {index + 1}
                            </span>
                            <div>
                                <p className="text-sm font-bold text-gray-200 leading-none">{user.name}</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">{user.titles} Títulos</p>
                            </div>
                        </div>
                        <span className="text-yellow-500 font-black font-teko text-lg">{user.globalPoints} pts</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Temporada 2026</span>
            </div>
        </div>
    )
}