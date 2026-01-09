'use client'

import { useState } from "react"
import { requestChampionshipAction, findLeagueAction } from "@/actions/landing-actions"

export function HeroActions() {
    const [modalOpen, setModalOpen] = useState<'NONE' | 'CREATE' | 'JOIN'>('NONE')
    const [loading, setLoading] = useState(false)

    // Função auxiliar para fechar clicando fora ou no X
    const closeModal = () => setModalOpen('NONE')

    return (
        <>
            {/* BOTÕES PRINCIPAIS (Responsivo: Coluna no mobile, Linha no Desktop) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mt-6">

                {/* Botão Criar (Destaque) */}
                <button
                    onClick={() => setModalOpen('CREATE')}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded transform sm:hover:skew-x-[-10deg] transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                    Criar Campeonato 🏆
                </button>

                {/* Botão Entrar (Secundário) */}
                <button
                    onClick={() => setModalOpen('JOIN')}
                    className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-lg rounded backdrop-blur-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                    Entrar na Liga ➜
                </button>
            </div>

            {/* === MODAL: SOLICITAR CRIAÇÃO === */}
            {modalOpen === 'CREATE' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        <h2 className="text-3xl font-bold italic text-white mb-1 font-teko uppercase">SOLICITAR CAMPEONATO</h2>
                        <p className="text-sm text-gray-400 mb-6 font-sans">Envie os dados para nossa equipe liberar seu acesso.</p>

                        <form action={async (formData) => {
                            setLoading(true)
                            const res = await requestChampionshipAction(formData)
                            setLoading(false)
                            if(res.success) {
                                alert("✅ " + res.message)
                                closeModal()
                            } else {
                                alert("❌ " + res.message)
                            }
                        }} className="space-y-4">

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold font-sans">Nome do Campeonato</label>
                                <input name="name" placeholder="Ex: Copa dos Amigos" className="w-full bg-[#0f0f0f] border border-white/20 rounded p-3 text-white focus:border-emerald-500 outline-none mt-1 font-sans" required />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold font-sans">Liga Base</label>
                                <div className="relative">
                                    <select name="leagueType" defaultValue="" className="w-full bg-[#0f0f0f] border border-white/20 rounded p-3 text-white focus:border-emerald-500 outline-none mt-1 appearance-none cursor-pointer font-sans">
                                        <option value="" disabled>Selecione uma liga...</option>

                                        <optgroup label="América">
                                            <option value="Brasileirão">🇧🇷 Brasileirão Série A</option>
                                            <option value="Brasileirão B">🇧🇷 Brasileirão Série B</option>
                                            <option value="Libertadores">🌎 Copa Libertadores</option>
                                            <option value="MLS">🇺🇸 Major League Soccer (MLS)</option>
                                        </optgroup>

                                        <optgroup label="Europa (Top 5)">
                                            <option value="Premier League">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</option>
                                            <option value="La Liga">🇪🇸 La Liga</option>
                                            <option value="Serie A">🇮🇹 Serie A</option>
                                            <option value="Bundesliga">🇩🇪 Bundesliga</option>
                                            <option value="Ligue 1">🇫🇷 Ligue 1</option>
                                            <option value="Champions League">🇪🇺 Champions League</option>
                                        </optgroup>

                                        <optgroup label="Outras Ligas">
                                            <option value="Saudi Pro League">🇸🇦 Saudi Pro League</option>
                                            <option value="Primeira Liga">🇵🇹 Primeira Liga (Portugal)</option>
                                            <option value="Eredivisie">🇳🇱 Eredivisie (Holanda)</option>
                                            <option value="Championship">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Championship (ING 2ª Div)</option>
                                            <option value="Jupiler Pro League">🇧🇪 Jupiler Pro League (Bélgica)</option>
                                            <option value="Personalizada">⭐ Liga Personalizada</option>
                                        </optgroup>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 mt-1">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold font-sans">Seu WhatsApp</label>
                                <input name="whatsapp" placeholder="(11) 99999-9999" className="w-full bg-[#0f0f0f] border border-white/20 rounded p-3 text-white focus:border-emerald-500 outline-none mt-1 font-sans" required />
                            </div>

                            <button disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black py-3 rounded mt-2 uppercase tracking-wide disabled:opacity-50 transition-all shadow-lg hover:shadow-emerald-500/20 font-sans">
                                {loading ? "Enviando..." : "ENVIAR SOLICITAÇÃO"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL: ENTRAR NA LIGA === */}
            {modalOpen === 'JOIN' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                            </div>
                            <h2 className="text-3xl font-bold italic text-white font-teko uppercase">ENTRAR NA LIGA</h2>
                            <p className="text-sm text-gray-400 font-sans">Digite o código (Slug) da liga que você recebeu.</p>
                        </div>

                        <form action={async (formData) => {
                            setLoading(true)
                            const res = await findLeagueAction(formData)
                            if(!res.success) {
                                setLoading(false)
                                alert("⚠️ " + res.message)
                            }
                        }} className="space-y-4">

                            <div>
                                <input
                                    name="slug"
                                    placeholder="Ex: copa-do-pedro-2026"
                                    className="w-full bg-[#0f0f0f] border border-white/20 rounded p-4 text-center text-white text-lg font-bold focus:border-emerald-500 outline-none placeholder:font-normal placeholder:text-gray-600 uppercase font-sans"
                                    autoFocus
                                    required
                                />
                            </div>

                            <button disabled={loading} className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 rounded mt-2 uppercase tracking-wide disabled:opacity-50 font-sans">
                                {loading ? "Buscando..." : "BUSCAR LIGA"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}