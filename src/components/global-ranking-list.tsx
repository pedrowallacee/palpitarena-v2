'use client'

interface GlobalRankingListProps {
    users: {
        id: string
        name: string
        globalPoints: number
        image?: string | null
    }[]
}

export function GlobalRankingList({ users }: GlobalRankingListProps) {

    // FUNÇÃO QUE DEFINE OS EMOJIS POR POSIÇÃO
    const getRankEmoji = (index: number) => {
        const pos = index + 1

        // Sua hierarquia personalizada:
        if (pos === 1) return '💠'  // Top 1
        if (pos === 2) return '👑'  // Top 2
        if (pos === 3) return '🏆'  // Top 3
        if (pos === 4) return '🏅'  // Top 4
        if (pos === 5) return '🥈'  // Top 5
        if (pos === 6) return '🥉'  // Top 6

        // Do 7 ao 10, usamos os números quadrados
        if (pos === 7) return '1️⃣'
        if (pos === 8) return '2️⃣' // Nota: Aqui você pediu 1, 2, 3... reiniciando a contagem visual ou seguindo?
                                    // Vou seguir a lógica de números do teclado emoji
        if (pos === 9) return '3️⃣'
        if (pos === 10) return '4️⃣'

        return `#${pos}` // Do 11 pra frente fica normal
    }

    return (
        <div className="flex flex-col gap-2">
            {users.map((user, index) => {
                const emoji = getRankEmoji(index)

                // Destaque visual para o TOP 3
                const isTop3 = index < 3
                const bgClass = isTop3 ? 'bg-[#1a1a1a] border-yellow-500/20' : 'bg-[#121212] border-white/5'
                const textClass = index === 0 ? 'text-blue-400' : index === 1 ? 'text-yellow-400' : 'text-white'

                return (
                    <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl border ${bgClass} transition-transform hover:scale-[1.01]`}>
                        <div className="flex items-center gap-4">
                            {/* Emoji da Posição */}
                            <span className="text-2xl w-10 text-center filter drop-shadow-lg">{emoji}</span>

                            {/* Nome */}
                            <div className="flex items-center gap-3">
                                <span className="text-gray-600 font-bold text-xs hidden md:inline">-</span>
                                <span className={`text-lg font-black uppercase tracking-wide ${textClass}`}>
                                    {user.name}
                                </span>
                            </div>
                        </div>

                        {/* Pontos */}
                        <div className="flex items-center gap-1">
                            <span className={`text-2xl font-black font-teko ${isTop3 ? 'text-white' : 'text-gray-400'}`}>
                                {user.globalPoints}
                            </span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase mt-1">Pts</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}