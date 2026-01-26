import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { InternalNavbar } from "@/components/internal-navbar"
import { revalidatePath } from "next/cache"
import { ArrowLeft, Settings, ShieldAlert, Trophy, Users, UserMinus, UserPlus } from "lucide-react"
import { DrawButton } from "@/components/admin/draw-button"
// Se você tiver o InviteRescueButton, mantenha o import. Se não, comente.
// import { InviteRescueButton } from "@/components/invite-rescue-button"

// --- AÇÕES DE SERVIDOR (Mantendo o que você já tinha) ---

async function releaseTeam(formData: FormData) {
    'use server'
    const participantId = formData.get("participantId") as string
    const slug = formData.get("slug") as string

    // Time fica sem dono (userId = null)
    await prisma.championshipParticipant.update({
        where: { id: participantId },
        data: { userId: null }
    })
    revalidatePath(`/campeonatos/${slug}/editar`)
}

async function assumeTeam(formData: FormData) {
    'use server'
    const participantId = formData.get("participantId") as string
    const slug = formData.get("slug") as string
    const userId = formData.get("adminId") as string

    // Admin assume o time
    await prisma.championshipParticipant.update({
        where: { id: participantId },
        data: { userId: userId }
    })
    revalidatePath(`/campeonatos/${slug}`)
    redirect(`/campeonatos/${slug}`)
}

// --- PÁGINA PRINCIPAL ---

export default async function EditarCampeonatoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 1. Busca Campeonato
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            participants: {
                include: { user: true },
                orderBy: { points: 'desc' }
            }
        }
    })

    if (!championship) return notFound()

    // 2. Segurança (Admin ou Dono)
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (championship.ownerId !== userId && currentUser?.role !== 'ADMIN') {
        return <div className="p-8 text-center text-red-500">Acesso Negado: Você não é o dono desta liga.</div>
    }

    // Filtros para gestão de elenco
    const activeParticipants = championship.participants.filter(p => p.userId !== null)
    const abandonedTeams = championship.participants.filter(p => p.userId === null)
    const adminIsParticipating = championship.participants.some(p => p.userId === userId)

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
            <InternalNavbar />

            <div className="max-w-5xl mx-auto px-4 mt-8">

                {/* CABEÇALHO */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/campeonatos/${slug}`} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black font-teko uppercase text-white flex items-center gap-2">
                            <Settings className="w-6 h-6 text-gray-500" />
                            Painel do Treinador
                        </h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                            Configurações • {championship.name}
                        </p>
                    </div>
                </div>

                <div className="space-y-8">

                    {/* =========================================================
                        PAINEL 1: SORTEIO FIFA (NOVO)
                       ========================================================= */}
                    <section className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-indigo-900/40 to-[#121212] p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                <Trophy className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase text-white">Fase de Grupos</h2>
                                <p className="text-xs text-gray-400 font-bold">Sorteio automático e Tabela de Jogos.</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-yellow-500" />
                                        Atenção ao realizar o sorteio:
                                    </h3>
                                    <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4 font-medium">
                                        <li>O sistema vai embaralhar os <strong>{championship.participants.length} participantes</strong>.</li>
                                        <li>Serão criados Grupos de 4 times (A, B, C...).</li>
                                        <li>Serão gerados os confrontos (Rodadas) automaticamente.</li>
                                        <li><strong className="text-red-400">Isso apaga grupos/jogos anteriores desta liga.</strong></li>
                                    </ul>
                                </div>

                                <div className="w-full md:w-auto min-w-[240px]">
                                    <DrawButton championshipId={championship.id} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =========================================================
                        PAINEL 2: GESTÃO DE ELENCO (EXISTENTE - RESTAURADO)
                       ========================================================= */}
                    <section className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        <div className="bg-[#1a1a1a] p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                <Users className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase text-white">Gestão de Elenco</h2>
                                <p className="text-xs text-gray-400 font-bold">Liberar vagas ou assumir times abandonados.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* TIMES ABANDONADOS */}
                            {abandonedTeams.length > 0 && (
                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-yellow-500 uppercase mb-3 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" /> Times Abandonados (Sem Dono)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {abandonedTeams.map(part => (
                                            <div key={part.id} className="flex items-center justify-between bg-black/40 p-3 rounded border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    {part.teamLogo ? (
                                                        <img src={part.teamLogo} className="w-8 h-8 object-contain" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">⚽</div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{part.teamName}</p>
                                                        <p className="text-[10px] text-gray-500 font-mono">Pontos mantidos: {part.points}</p>
                                                    </div>
                                                </div>

                                                {!adminIsParticipating && (
                                                    <form action={assumeTeam}>
                                                        <input type="hidden" name="participantId" value={part.id} />
                                                        <input type="hidden" name="slug" value={slug} />
                                                        <input type="hidden" name="adminId" value={userId} />
                                                        <button className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black px-3 py-2 rounded uppercase transition-colors">
                                                            <UserPlus className="w-3 h-3" /> Eu Assumo
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TIMES ATIVOS */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Jogadores Ativos ({activeParticipants.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {activeParticipants.map(part => (
                                        <div key={part.id} className="flex items-center justify-between bg-[#0f0f0f] p-3 rounded border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                                                    {part.teamLogo ? (
                                                        <img src={part.teamLogo} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-500">{part.teamName.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-200">{part.teamName}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">{part.user?.name}</p>
                                                </div>
                                            </div>

                                            {part.userId !== userId && (
                                                <form action={releaseTeam}>
                                                    <input type="hidden" name="participantId" value={part.id} />
                                                    <input type="hidden" name="slug" value={slug} />
                                                    <button className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold px-3 py-2 rounded uppercase border border-red-500/20 transition-colors" title="Remover jogador do time">
                                                        <UserMinus className="w-3 h-3" /> Liberar
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}