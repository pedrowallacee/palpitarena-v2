import React from 'react';
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { BettingList } from "@/components/betting-list"

export default async function RodadaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // Busca campeonato e dados
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            rounds: {
                orderBy: { createdAt: 'desc' },
                include: {
                    matches: {
                        orderBy: { date: 'asc' },
                        include: {
                            // ATUALIZADO: Busca predictions do usuário
                            predictions: {
                                where: { userId: userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!championship) return <div className="p-8 text-white">Campeonato não encontrado</div>

    // Lógica para definir qual rodada mostrar
    const activeRound = championship.rounds.find(r => r.status === 'OPEN') || championship.rounds[0];
    const hasMatches = activeRound && activeRound.matches.length > 0;

    return (
        <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-white font-sans relative overflow-x-hidden selection:bg-[#a3e635] selection:text-black">

            {/* Background Overlay */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="fixed inset-0 bg-gradient-to-b from-[#0f0f0f] via-transparent to-[#0f0f0f] z-0 pointer-events-none"></div>

            {/* Navbar Simplificada para o contexto */}
            <nav className="relative z-10 w-full border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur-sm h-20 flex items-center justify-center">
                <h1 className="text-2xl font-bold font-['Teko'] tracking-wide">
                    {championship.name}
                </h1>
            </nav>

            <main className="relative z-10 flex-grow container mx-auto px-4 py-8 flex flex-col items-center">

                <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-5xl md:text-6xl font-bold text-white uppercase leading-none font-['Teko']">
                            {activeRound ? activeRound.name : "Rodada"}
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base tracking-wide mt-1 font-sans">
                            PRAZO: {activeRound ? new Date(activeRound.deadline).toLocaleDateString() : "--/--"}
                        </p>
                    </div>
                </div>

                {hasMatches ? (
                    <div className="w-full max-w-4xl">
                        {/* Passa os dados para a lista */}
                        <BettingList matches={activeRound.matches} />
                    </div>
                ) : (
                    /* Empty State */
                    <div className="w-full max-w-4xl min-h-[300px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm p-8">
                        <h3 className="text-xl font-bold text-gray-300">Sem jogos nesta rodada</h3>
                        <p className="text-gray-500">Aguarde a liberação dos jogos pelo administrador.</p>
                    </div>
                )}

            </main>
        </div>
    );
}