import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
// CORREÇÃO: Importar as ações específicas em vez de "handleRequestAction"
import { approveRequestAction, rejectRequestAction } from "@/actions/admin-actions"
import { InternalNavbar } from "@/components/internal-navbar"

export default async function AdminRequestsPage() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // Verifica se é ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== 'ADMIN') redirect("/dashboard")

    // Busca solicitações pendentes
    const pendingRequests = await prisma.championshipRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <InternalNavbar />

            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-black italic font-teko uppercase text-white mb-8 border-b border-white/10 pb-4">
                    GERENCIAR SOLICITAÇÕES
                </h1>

                {pendingRequests.length === 0 ? (
                    <div className="p-10 bg-[#1a1a1a] border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                        <p>Nenhuma solicitação pendente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-[#1a1a1a] border border-white/10 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                                <div>
                                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase font-bold mb-2 inline-block">
                                        {req.leagueType}
                                    </span>
                                    <h3 className="text-xl font-black text-white uppercase leading-none mb-1">{req.name}</h3>
                                    <p className="text-xs text-gray-400 mb-4">Por: <strong className="text-white">{req.user.name}</strong></p>

                                    <div className="bg-[#0f0f0f] p-3 rounded border border-white/5 mb-4">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">WhatsApp</p>
                                        <div className="flex items-center gap-2 justify-between">
                                            <span className="text-emerald-400 font-mono font-bold">{req.whatsapp}</span>
                                            <a
                                                href={`https://wa.me/55${req.whatsapp.replace(/\D/g, "")}`}
                                                target="_blank"
                                                className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded hover:bg-emerald-500 hover:text-black transition-colors"
                                            >
                                                Chamar
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
                                    {/* Botão de Rejeitar */}
                                    <form action={async () => {
                                        'use server'
                                        await rejectRequestAction(req.id)
                                    }}>
                                        <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded font-bold text-xs uppercase transition-colors">
                                            Rejeitar
                                        </button>
                                    </form>

                                    {/* Botão de Aprovar */}
                                    <form action={async () => {
                                        'use server'
                                        await approveRequestAction(req.id)
                                    }}>
                                        <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded font-black text-xs uppercase transition-colors shadow-lg shadow-emerald-500/10">
                                            Aprovar
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}