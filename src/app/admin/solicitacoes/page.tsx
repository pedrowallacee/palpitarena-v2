import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { handleRequestAction } from "@/actions/admin-actions"

export default async function AdminRequestsPage() {
    // 1. Segurança: Verifica se é ADMIN
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== 'ADMIN') {
        return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-bold text-2xl">ACESSO NEGADO 🚫</div>
    }

    // 2. Busca pedidos pendentes
    const requests = await prisma.championshipRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
            <header className="max-w-6xl mx-auto mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black font-['Teko'] text-[#a3e635]">SUPER ADMIN</h1>
                    <p className="text-gray-400">Gerenciar solicitações de campeonatos</p>
                </div>
                <div className="bg-[#1a1a1a] px-4 py-2 rounded border border-white/10">
                    <span className="text-[#a3e635] font-bold text-xl">{requests.length}</span> Pendentes
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                {requests.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-500">Nenhuma solicitação pendente no momento.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-[#1a1a1a] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/20 transition-colors">

                                {/* Info do Pedido */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-bold text-white">{req.name}</h3>
                                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300 border border-white/10">
                                            {req.leagueType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            👤 {req.user.name}
                                        </span>
                                        <span className="flex items-center gap-1 text-[#a3e635]">
                                            📱 {req.whatsapp}
                                        </span>
                                        <span className="text-xs opacity-50">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-3">
                                    <form action={handleRequestAction}>
                                        <input type="hidden" name="requestId" value={req.id} />
                                        <input type="hidden" name="action" value="REJECT" />
                                        <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-bold transition-colors uppercase text-sm">
                                            Recusar
                                        </button>
                                    </form>

                                    <form action={handleRequestAction}>
                                        <input type="hidden" name="requestId" value={req.id} />
                                        <input type="hidden" name="action" value="APPROVE" />
                                        <button className="px-6 py-2 bg-[#a3e635] hover:bg-[#8cc629] text-black font-black rounded transition-transform hover:scale-105 uppercase text-sm shadow-lg shadow-[#a3e635]/20">
                                            Aprovar & Criar
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}