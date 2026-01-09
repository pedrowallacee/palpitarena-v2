// src/app/campeonatos/[slug]/rodada/page.tsx

import React from 'react';
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { BettingList } from "@/components/betting-list" // Certifique-se de ter criado este componente conforme o passo anterior

// Next.js 15: params é uma Promise
export default async function RodadaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // 1. Verificação de Auth
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 2. Buscar dados do Banco
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            rounds: {
                // Tenta pegar a rodada ABERTA ou a última criada
                orderBy: { createdAt: 'desc' },
                include: {
                    matches: {
                        orderBy: { date: 'asc' },
                        include: {
                            // Inclui o palpite do usuário logado para preencher os inputs
                            bets: {
                                where: { userId: userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    // Lógica para definir qual rodada mostrar
    // Prioridade: Rodada com status 'OPEN', senão pega a primeira da lista (mais recente)
    const activeRound = championship.rounds.find(r => r.status === 'OPEN') || championship.rounds[0];
    const hasMatches = activeRound && activeRound.matches.length > 0;

    return (
        <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-white font-sans relative overflow-x-hidden selection:bg-[#a3e635] selection:text-black">

            {/* Background Overlay e Imagem */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=2070&auto=format&fit=crop"
                    alt="Background Stadium"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="fixed inset-0 bg-gradient-to-b from-[#0f0f0f] via-transparent to-[#0f0f0f] z-0 pointer-events-none"></div>

            {/* NAVBAR */}
            <nav className="relative z-10 w-full border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">

                        {/* Logo */}
                        <div className="flex-shrink-0 cursor-pointer">
                            <h1 className="text-3xl font-bold italic tracking-wide font-['Teko']">
                                NIKAO <span className="text-[#a3e635]">FC</span>
                            </h1>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8 text-xl tracking-wider font-['Teko']">
                                <a href={`/campeonatos/${slug}/rodada`} className="text-white border-b-2 border-[#a3e635] px-3 py-2 transition-colors">
                                    JOGOS
                                </a>
                                <a href="#" className="text-gray-400 hover:text-[#a3e635] hover:border-b-2 hover:border-[#a3e635]/50 px-3 py-2 transition-all">TABELA</a>
                                <a href="#" className="text-gray-400 hover:text-[#a3e635] hover:border-b-2 hover:border-[#a3e635]/50 px-3 py-2 transition-all">PALPITES</a>
                                <a href="#" className="text-gray-400 hover:text-[#a3e635] hover:border-b-2 hover:border-[#a3e635]/50 px-3 py-2 transition-all">RANKING</a>
                            </div>
                        </div>

                        {/* Perfil (Direita) */}
                        <div className="hidden md:flex items-center gap-3 bg-white/5 rounded-full pl-4 pr-1 py-1 border border-white/10">
                            <span className="text-sm text-gray-300 font-medium">Treinador</span>
                            <div className="h-8 w-8 rounded-full bg-[#a3e635] text-[#0f0f0f] flex items-center justify-center font-bold">
                                T
                            </div>
                        </div>

                        {/* Botão Mobile */}
                        <div className="-mr-2 flex md:hidden">
                            <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none">
                                <svg className="h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="relative z-10 flex-grow container mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">

                {/* Cabeçalho da Seção + Dropdown */}
                <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-5xl md:text-6xl font-bold text-white uppercase leading-none font-['Teko']">
                            {activeRound ? activeRound.name : "Rodada"}
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base tracking-wide mt-1 font-sans">
                            FAÇA SEUS PALPITES ABAIXO
                        </p>
                    </div>

                    {/* Select Customizado (Lista as rodadas disponíveis) */}
                    <div className="relative w-full md:w-64">
                        <select
                            className="block w-full pl-4 pr-10 py-3 text-base border-gray-600 focus:outline-none focus:ring-[#a3e635] focus:border-[#a3e635] sm:text-sm rounded-lg bg-white/5 text-white border border-white/10 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                            defaultValue={activeRound?.id}
                        >
                            {championship.rounds.length > 0 ? (
                                championship.rounds.map(r => (
                                    <option key={r.id} value={r.id} className="bg-[#1a1a1a] text-white">
                                        {r.name} {r.status === 'OPEN' ? '(Aberta)' : ''}
                                    </option>
                                ))
                            ) : (
                                <option>Nenhuma rodada</option>
                            )}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Lógica de Exibição: Tem jogos ou não? */}
                {hasMatches ? (

                    /* SE TIVER JOGOS: Renderiza o componente de Lista (que contém o botão Salvar) */
                    <div className="w-full max-w-4xl">
                        <BettingList matches={activeRound.matches} />
                    </div>

                ) : (

                    /* EMPTY STATE: Se não tiver jogos, mostra o visual "Sem Jogos" */
                    <div className="w-full max-w-4xl flex-grow min-h-[400px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm p-8 transition-all hover:border-white/20">
                        <div className="text-center">
                            {/* Ícone de Calendário */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 mb-4 text-gray-500">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11L9 17M9 11l6 6" />
                                </svg>
                            </div>

                            <h3 className="text-xl md:text-2xl font-semibold text-gray-300 tracking-wide font-['Teko']">
                                Sem jogos nesta rodada
                            </h3>
                            <p className="text-gray-500 mt-2 text-sm md:text-base max-w-md mx-auto">
                                Aguarde a atualização da tabela pelo treinador ou selecione outra rodada no menu acima.
                            </p>
                        </div>
                    </div>

                )}

            </main>
        </div>
    );
}