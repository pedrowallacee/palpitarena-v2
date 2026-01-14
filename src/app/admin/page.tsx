import { getAdminDashboardData, approveRequestAction, rejectRequestAction, toggleUserRoleAction } from "@/actions/admin-actions"
import { InternalNavbar } from "@/components/internal-navbar"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    let data
    try {
        data = await getAdminDashboardData()
    } catch (e) {
        redirect("/dashboard") // Se não for admin, chuta pro dashboard
    }

    const { pendingRequests, users } = data

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <InternalNavbar />

            <div className="max-w-7xl mx-auto p-6 space-y-10">

                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h1 className="text-4xl font-black italic font-teko uppercase text-white">
                        Painel do <span className="text-red-500">Super Admin</span>
                    </h1>
                    <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded text-xs font-bold uppercase border border-red-500/20">
                        Área Restrita
                    </span>
                </div>

                {/* --- SEÇÃO 1: SOLICITAÇÕES PENDENTES --- */}
                <section>
                    <h2 className="text-2xl font-bold font-teko uppercase text-yellow-400 mb-4 flex items-center gap-2">
                        🔔 Solicitações de Ligas ({pendingRequests.length})
                    </h2>

                    {pendingRequests.length === 0 ? (
                        <div className="p-8 bg-[#1a1a1a] border border-dashed border-white/10 rounded-xl text-center text-gray-500">
                            Nenhuma solicitação pendente no momento.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-[#1a1a1a] border border-white/10 p-5 rounded-xl shadow-lg flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase font-bold">{req.leagueType}</span>
                                            <span className="text-[10px] text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase leading-none mb-1">{req.name}</h3>

                                        <div className="mt-4 space-y-2 bg-[#0f0f0f] p-3 rounded border border-white/5">
                                            <p className="text-xs text-gray-400 uppercase font-bold">Solicitante:</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-[10px]">👤</div>
                                                <span className="text-sm font-bold text-white">{req.user.name}</span>
                                            </div>

                                            <p className="text-xs text-gray-400 uppercase font-bold mt-2">WhatsApp:</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-mono text-emerald-400 font-bold select-all">{req.whatsapp}</span>
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

                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                                        <form action={async () => {
                                            'use server'
                                            await rejectRequestAction(req.id)
                                        }}>
                                            <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded font-bold text-xs uppercase transition-colors">
                                                Rejeitar
                                            </button>
                                        </form>

                                        <form action={async () => {
                                            'use server'
                                            await approveRequestAction(req.id)
                                        }}>
                                            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded font-black text-xs uppercase transition-colors shadow-lg shadow-emerald-500/20">
                                                Aprovar & Criar
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* --- SEÇÃO 2: GERENCIAR USUÁRIOS --- */}
                <section>
                    <h2 className="text-2xl font-bold font-teko uppercase text-blue-400 mb-4 flex items-center gap-2">
                        👥 Lista de Usuários
                    </h2>

                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#222] text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Email</th>
                                <th className="p-4 text-center">Cargo Atual</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                        {u.image ? <img src={u.image} className="w-6 h-6 rounded-full"/> : <div className="w-6 h-6 bg-gray-700 rounded-full"/>}
                                        {u.name}
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-xs">{u.email}</td>
                                    <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                u.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}>
                                                {u.role}
                                            </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <form action={async () => {
                                            'use server'
                                            await toggleUserRoleAction(u.id, u.role)
                                        }}>
                                            <button className={`text-[10px] font-bold px-3 py-1 rounded uppercase border transition-all ${
                                                u.role === 'USER'
                                                    ? 'border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
                                                    : 'border-gray-500/30 text-gray-400 hover:bg-gray-700'
                                            }`}>
                                                {u.role === 'USER' ? 'Promover a Admin' : 'Rebaixar a User'}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    )
}