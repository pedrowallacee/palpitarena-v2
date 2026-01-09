import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { InviteButton } from "@/components/invite-button"
import { DeleteChampionshipButton } from "@/components/delete-championship-button"
import { DrawGroupsButton } from "@/components/admin/draw-button"
import { GroupsViewer } from "@/components/groups-viewer"

// Tipagem para Next.js 15
export default async function ChampionshipDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // 1. Verificar usuário
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) redirect("/login")

    // 2. Buscar o Campeonato e suas Rodadas
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            owner: true,
            rounds: {
                orderBy: { createdAt: 'desc' } // Rodadas novas primeiro
            }
        }
    })

    if (!championship) return notFound()

    // 3. Lógica de Admin e Rodada Ativa
    const isOwner = championship.ownerId === userId

    // Pega a rodada mais recente para destacar no card de "JOGAR"
    const latestRound = championship.rounds[0];
    // Verifica status compatível com o Enum (OPEN) ou lógica antiga (AGUARDANDO)
    const hasOpenRound = latestRound?.status === 'OPEN';

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-[#a3e635] selection:text-black">

            {/* HEADER */}
            <header className="border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold italic tracking-wide font-['Teko'] uppercase text-white">
                                {championship.name}
                            </h1>
                            <p className="text-xs text-gray-500 font-sans hidden md:block">
                                Organizado por <span className="text-[#a3e635]">{championship.owner.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <InviteButton slug={slug} />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* === COLUNA ESQUERDA (JOGADOR) === */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. CARD DE AÇÃO (JOGAR) */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#a3e635] to-[#15803d] rounded-2xl opacity-50 group-hover:opacity-100 transition duration-500 blur"></div>
                            <div className="relative bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">

                                <div className="flex-1 text-center md:text-left">
                                    {hasOpenRound ? (
                                        <>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a3e635]/10 text-[#a3e635] text-xs font-bold mb-3 border border-[#a3e635]/20 animate-pulse">
                                                <span className="w-2 h-2 rounded-full bg-[#a3e635]"></span>
                                                RODADA ABERTA
                                            </div>
                                            <h2 className="text-3xl font-bold font-['Teko'] mb-2">
                                                {latestRound?.name}
                                            </h2>
                                            <p className="text-gray-400 text-sm mb-0">
                                                Faça seus palpites antes que o prazo encerre!
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700/30 text-gray-400 text-xs font-bold mb-3 border border-white/10">
                                                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                                AGUARDANDO
                                            </div>
                                            <h2 className="text-3xl font-bold font-['Teko'] mb-2 text-gray-300">
                                                Sem rodada ativa
                                            </h2>
                                            <p className="text-gray-500 text-sm mb-0">
                                                Aguarde o organizador liberar os próximos jogos.
                                            </p>
                                        </>
                                    )}
                                </div>

                                {hasOpenRound ? (
                                    <Link
                                        href={`/campeonatos/${slug}/rodada`}
                                        className="whitespace-nowrap px-8 py-4 bg-[#a3e635] hover:bg-[#8cc629] text-black font-black uppercase tracking-wider rounded-lg transition-transform transform hover:-translate-y-1 shadow-lg shadow-[#a3e635]/20 flex items-center gap-2"
                                    >
                                        Fazer Palpites <span className="text-xl">➜</span>
                                    </Link>
                                ) : (
                                    <button disabled className="whitespace-nowrap px-8 py-4 bg-white/5 text-gray-500 font-bold uppercase tracking-wider rounded-lg cursor-not-allowed border border-white/5">
                                        Em breve
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. TABELA DE CLASSIFICAÇÃO (GRUPOS) - NOVO! */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                                <h3 className="text-xl font-['Teko'] font-bold text-white uppercase">Classificação</h3>
                                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Fase de Grupos</span>
                            </div>

                            {/* Componente que renderiza as tabelas A, B, C... */}
                            <GroupsViewer championshipId={championship.id} />
                        </div>

                        {/* 3. HISTÓRICO */}
                        <div>
                            <h3 className="text-xl font-['Teko'] font-bold text-white mb-4 mt-8 text-gray-400">HISTÓRICO</h3>
                            <div className="space-y-3">
                                {championship.rounds.length > 0 ? (
                                    championship.rounds.map((round) => (
                                        <div key={round.id} className="flex items-center justify-between p-4 bg-[#151515] border border-white/5 rounded-lg hover:border-white/10 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-gray-200">{round.name}</h4>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(round.deadline).toLocaleDateString('pt-BR')} • {round.status}
                                                </span>
                                            </div>
                                            <Link href={`/campeonatos/${slug}/rodada/${round.id}`} className="text-sm text-[#a3e635] hover:underline">
                                                Ver Detalhes
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600 text-sm italic">Nenhum histórico disponível.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* === COLUNA DIREITA (ADMIN) === */}
                    <div className="lg:col-span-1">
                        {isOwner && (
                            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 sticky top-24">
                                <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                                    <div className="bg-[#a3e635] p-1.5 rounded text-black">
                                        {/* Ícone Admin */}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    </div>
                                    <h3 className="font-bold text-white uppercase tracking-wider font-['Teko'] text-xl">
                                        Painel do Dono
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {/* BOTÃO DE SORTEIO (Só aparece na fase de registro) - NOVO! */}
                                    {championship.status === 'REGISTRATION' && (
                                        <div className="mb-4 pb-4 border-b border-white/10">
                                            <p className="text-xs text-gray-400 mb-2">Configure o torneio:</p>
                                            <DrawGroupsButton championshipId={championship.id} />
                                        </div>
                                    )}

                                    <Link
                                        href={`/campeonatos/${slug}/nova-rodada`}
                                        className="block w-full py-3 px-4 bg-white/5 hover:bg-[#a3e635] hover:text-black border border-white/10 rounded-lg text-sm font-medium transition-all group flex items-center justify-between"
                                    >
                                        <span>+ Criar Nova Rodada</span>
                                    </Link>

                                    <Link
                                        href={`/campeonatos/${slug}/editar`}
                                        className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-between"
                                    >
                                        <span>⚙️ Configurações</span>
                                    </Link>

                                    <div className="pt-2">
                                        <InviteButton slug={slug} />
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-white/10">
                                        <DeleteChampionshipButton id={championship.id} name={championship.name} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    )
}