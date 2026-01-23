import { prisma } from "@/lib/prisma"
import { COMPETITION_LIST, COMPETITION_CATEGORIES } from "@/lib/ranking-rules"
import { AdminHistoryForm } from "./form" // Vamos criar o form separado abaixo

export default async function AdminHistoryPage() {
    // 1. Buscar todos os usuários para o dropdown
    const users = await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })

    // 2. Buscar resultados já salvos da Season 2 (Atual)
    const savedResults = await prisma.historicalResult.findMany({
        where: { season: 'season2' }
    })

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-8 text-white">
            <h1 className="text-3xl font-black text-emerald-500 mb-8 uppercase font-teko">
                Gerenciar Sala de Troféus (2ª Temporada)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COMPETITION_LIST.map((comp) => {
                    // Acha se já tem resultado salvo para preencher o form
                    const saved = savedResults.find(r => r.leagueName === comp.name)

                    return (
                        <div key={comp.name} className="bg-[#121212] border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                                <span className="text-2xl">{comp.flag}</span>
                                <div>
                                    <h3 className="font-bold text-sm text-white uppercase">{comp.name}</h3>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                                        {COMPETITION_CATEGORIES[comp.category as keyof typeof COMPETITION_CATEGORIES].label}
                                    </span>
                                </div>
                            </div>

                            {/* O FORMULÁRIO DE CADA LIGA */}
                            <AdminHistoryForm
                                competition={comp}
                                saved={saved}
                                users={users}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}