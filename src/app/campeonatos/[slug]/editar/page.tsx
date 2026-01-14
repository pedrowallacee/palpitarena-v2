import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { InternalNavbar } from "@/components/internal-navbar"
import { revalidatePath } from "next/cache"
import { InviteRescueButton } from "@/components/invite-rescue-button" // Vamos criar esse botãozinho

// 1. AÇÃO DE LIBERAR (Deixa o time órfão)
async function releaseTeam(formData: FormData) {
    'use server'
    const participantId = formData.get("participantId") as string
    const slug = formData.get("slug") as string

    // Define userId como NULL (Time fica sem dono, mas mantém pontos)
    await prisma.championshipParticipant.update({
        where: { id: participantId },
        data: { userId: null }
    })
    revalidatePath(`/campeonatos/${slug}/editar`)
}

// 2. AÇÃO DE ASSUMIR (Admin pega pra ele)
async function assumeTeam(formData: FormData) {
    'use server'
    const participantId = formData.get("participantId") as string
    const slug = formData.get("slug") as string
    const userId = formData.get("adminId") as string

    // Pega o time para o admin
    await prisma.championshipParticipant.update({
        where: { id: participantId },
        data: { userId: userId }
    })
    revalidatePath(`/campeonatos/${slug}`)
    redirect(`/campeonatos/${slug}`)
}

export default async function EditarCampeonatoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            participants: {
                include: { user: true },
                orderBy: { points: 'desc' }
            }
        }
    })

    if (!championship) return <div>404</div>
    if (championship.ownerId !== userId) return <div>Acesso Negado</div>

    const activeParticipants = championship.participants.filter(p => p.userId !== null)
    const abandonedTeams = championship.participants.filter(p => p.userId === null)

    // Verifica se admin já joga
    const adminIsParticipating = championship.participants.some(p => p.userId === userId)

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <InternalNavbar />

            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/campeonatos/${slug}`} className="text-sm text-gray-500 hover:text-white uppercase font-bold">
                        ⬅ Voltar
                    </Link>
                    <h1 className="text-3xl font-black italic font-teko uppercase">GESTÃO DE ELENCO</h1>
                </div>

                {/* 1. LISTA DE ABANDONADOS (Onde a mágica acontece) */}
                {abandonedTeams.length > 0 && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 mb-8 animate-in slide-in-from-top-4">
                        <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2 uppercase font-teko">
                            ⚠️ Times Sem Técnico (Abandonados)
                        </h2>
                        <div className="space-y-3">
                            {abandonedTeams.map(part => (
                                <div key={part.id} className="flex flex-col md:flex-row items-center justify-between bg-[#0f0f0f] p-4 rounded-lg border border-yellow-500/10 gap-4">
                                    <div className="flex items-center gap-4">
                                        {part.teamLogo ? <img src={part.teamLogo} className="w-12 h-12 object-contain" /> : <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">⚽</div>}
                                        <div>
                                            <p className="font-bold text-white text-lg leading-none">{part.teamName}</p>
                                            <p className="text-xs text-yellow-500 font-bold mt-1">Pontuação mantida: {part.points} pts</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        {/* BOTÃO LINK DE RESGATE */}
                                        <InviteRescueButton participantId={part.id} teamName={part.teamName} />

                                        {/* BOTÃO ASSUMIR (Se Admin não joga) */}
                                        {!adminIsParticipating && (
                                            <form action={assumeTeam}>
                                                <input type="hidden" name="participantId" value={part.id} />
                                                <input type="hidden" name="slug" value={slug} />
                                                <input type="hidden" name="adminId" value={userId} />
                                                <button className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black px-4 py-3 rounded uppercase transition-colors shadow-lg">
                                                    Eu Assumo 🙋‍♂️
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. LISTA DE ATIVOS */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-teko uppercase">
                        ✅ Jogadores Ativos
                    </h2>
                    <div className="space-y-3">
                        {activeParticipants.map(part => (
                            <div key={part.id} className="flex items-center justify-between bg-[#0f0f0f] p-4 rounded-lg border border-white/5">
                                <div className="flex items-center gap-4">
                                    {part.teamLogo ? <img src={part.teamLogo} className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-gray-700 rounded-full"></div>}
                                    <div>
                                        <p className="font-bold text-white leading-none">{part.teamName}</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase">{part.user?.name}</p>
                                    </div>
                                </div>

                                {part.userId !== userId && (
                                    <form action={releaseTeam}>
                                        <input type="hidden" name="participantId" value={part.id} />
                                        <input type="hidden" name="slug" value={slug} />
                                        <button className="bg-red-500/10 hover:bg-red-500/30 text-red-500 text-[10px] font-bold px-3 py-2 rounded uppercase border border-red-500/20 transition-colors">
                                            Liberar Vaga 🔓
                                        </button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}