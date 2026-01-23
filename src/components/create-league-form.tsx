'use client'

import { useState } from "react"
import { requestChampionshipAction } from "@/actions/landing-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function CreateLeagueForm() {
    const [loading, setLoading] = useState(false)
    const [whatsapp, setWhatsapp] = useState("")
    const [selectedFormat, setSelectedFormat] = useState("POINTS")
    const [adminPlays, setAdminPlays] = useState("yes")
    const router = useRouter()

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value = e.target.value
        value = value.replace(/\D/g, "")
        if (value.length > 11) value = value.slice(0, 11)
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2")
        value = value.replace(/(\d)(\d{4})$/, "$1-$2")
        setWhatsapp(value)
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.set("format", selectedFormat)
        formData.set("adminParticipates", adminPlays)

        const res = await requestChampionshipAction(formData) as any
        setLoading(false)

        if (res.success) {
            if (res.redirectUrl) {
                router.push(res.redirectUrl)
            } else {
                alert("✅ " + res.message)
                router.push("/dashboard")
            }
        } else {
            alert("❌ " + res.message)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="w-full max-w-3xl mb-6 relative z-10 flex items-center justify-between">
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest flex items-center gap-2 group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Painel
                </Link>
            </div>

            <div className="w-full max-w-3xl bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 backdrop-blur-sm">

                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black italic font-teko uppercase text-white leading-none">
                        Criar Nova <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">Liga</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-medium">Configure as regras e convoque os jogadores.</p>
                </div>

                <form action={handleSubmit} className="space-y-8">

                    {/* 1. FORMATO */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-3 block">1. Escolha o Formato</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedFormat('POINTS')}
                                className={`relative p-4 rounded-xl border transition-all group text-left ${
                                    selectedFormat === 'POINTS' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                                <div className={`mb-2 text-2xl ${selectedFormat === 'POINTS' ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>📈</div>
                                <h3 className={`font-bold uppercase text-sm font-teko tracking-wide ${selectedFormat === 'POINTS' ? 'text-emerald-400' : 'text-gray-300'}`}>Pontos Corridos</h3>
                                <p className="text-[10px] text-gray-500 leading-tight mt-1">O clássico. Quem somar mais pontos vence.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedFormat('KNOCKOUT')}
                                className={`relative p-4 rounded-xl border transition-all group text-left ${
                                    selectedFormat === 'KNOCKOUT' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                                <div className={`mb-2 text-2xl ${selectedFormat === 'KNOCKOUT' ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>🥊</div>
                                <h3 className={`font-bold uppercase text-sm font-teko tracking-wide ${selectedFormat === 'KNOCKOUT' ? 'text-emerald-400' : 'text-gray-300'}`}>Mata-Mata</h3>
                                <p className="text-[10px] text-gray-500 leading-tight mt-1">Confrontos eliminatórios diretos.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedFormat('GROUPS')}
                                className={`relative p-4 rounded-xl border transition-all group text-left ${
                                    selectedFormat === 'GROUPS' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                                <div className={`mb-2 text-2xl ${selectedFormat === 'GROUPS' ? 'scale-110' : 'grayscale opacity-50'} transition-all`}>🏆</div>
                                <h3 className={`font-bold uppercase text-sm font-teko tracking-wide ${selectedFormat === 'GROUPS' ? 'text-emerald-400' : 'text-gray-300'}`}>Estilo Copa</h3>
                                <p className="text-[10px] text-gray-500 leading-tight mt-1">Fase de Grupos seguida de Eliminatórias.</p>
                            </button>
                        </div>
                    </div>

                    {/* DADOS GERAIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 2. NOME */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">2. Nome do Campeonato</label>
                            <input name="name" type="text" placeholder="Ex: Copa da Firma 2026" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm font-bold placeholder:text-gray-700 focus:border-emerald-500 focus:bg-black/60 outline-none transition-all" required />
                        </div>

                        {/* 3. TIPO / BASE */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">3. Baseado em qual torneio?</label>
                            <div className="relative">
                                <select
                                    name="leagueType"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm font-bold appearance-none cursor-pointer focus:border-emerald-500 outline-none"
                                    required
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecione a competição...</option>
                                    <optgroup label="🇧🇷 Nacional" className="bg-[#1a1a1a]">
                                        <option value="Brasileirão Série A">🇧🇷 Serie A Betano</option>
                                        <option value="Copa do Brasil">🔰 Copa do Brasil</option>
                                    </optgroup>
                                    <optgroup label="🇪🇺 Europa - Elite" className="bg-[#1a1a1a]">
                                        <option value="Premier League">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</option>
                                        <option value="Serie A Tim">🇮🇹 Serie A Tim</option>
                                        <option value="La Liga">🇪🇸 La Liga</option>
                                        <option value="Bundesliga">🇩🇪 Bundesliga</option>
                                        <option value="Ligue 1">🇫🇷 Ligue 1</option>
                                        <option value="Liga Portugal">🇵🇹 Liga Portugal</option>
                                        <option value="Eredivisie">🇳🇱 Eredivisie</option>
                                    </optgroup>
                                    <optgroup label="🌎 Américas & Mundo" className="bg-[#1a1a1a]">
                                        <option value="Liga Profissional Arg">🇦🇷 Liga Profissional</option>
                                        <option value="MLS">🇺🇸 Major League Soccer</option>
                                        <option value="Saudi Pro League">🇸🇦 Liga Saudita</option>
                                        <option value="Liga All Stars">🇻🇳 Liga All Stars</option>
                                    </optgroup>
                                    <optgroup label="🏆 Torneios Internacionais" className="bg-[#1a1a1a]">
                                        <option value="Champions League">🌐 Champions League</option>
                                        <option value="Europa League">🌐 Europa League</option>
                                        <option value="Libertadores">🔱 Libertadores</option>
                                        <option value="Mundial de Clubes">🌍 Mundial de Clubes FIFA</option>
                                        <option value="Copa do Mundo">🌍 Copa do Mundo</option>
                                    </optgroup>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">▼</div>
                            </div>
                        </div>

                        {/* 4. WHATSAPP */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">4. Seu WhatsApp (Admin)</label>
                            <input name="whatsapp" value={whatsapp} onChange={handlePhoneChange} placeholder="(00) 00000-0000" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm font-bold placeholder:text-gray-700 focus:border-emerald-500 outline-none transition-all font-mono" maxLength={15} required />
                        </div>

                        {/* 5. CAPACIDADE (ATUALIZADO) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">5. Capacidade da Liga</label>
                            <div className="relative">
                                <select
                                    name="maxParticipants"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm font-bold appearance-none cursor-pointer focus:border-emerald-500 outline-none"
                                    defaultValue="16"
                                >
                                    <optgroup label="Formatos Recomendados" className="bg-[#1a1a1a]">
                                        <option value="8">8 Times (2 Grupos de 4)</option>
                                        <option value="10">10 Times (2 Grupos de 5)</option>
                                        <option value="12">12 Times (2 Grupos de 6)</option>
                                        <option value="16">16 Times (4 Grupos de 4) ★ Padrão</option>
                                        <option value="20">20 Times (4 Grupos de 5)</option>
                                        <option value="24">24 Times (4 Grupos de 6)</option>
                                        <option value="32">32 Times (8 Grupos de 4) 🏆 Copa do Mundo</option>
                                    </optgroup>
                                    <optgroup label="Outros" className="bg-[#1a1a1a]">
                                        <option value="100">100 Jogadores (Liga Massiva)</option>
                                    </optgroup>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">▼</div>
                            </div>
                            <p className="text-[9px] text-gray-500 ml-1">Defina o tamanho exato para montagem perfeita dos grupos.</p>
                        </div>
                    </div>

                    {/* TOGGLE ADMIN JOGA */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                👤
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase">Você vai participar?</h4>
                                <p className="text-xs text-gray-500">Se marcar NÃO, você será apenas o organizador (não pontua).</p>
                            </div>
                        </div>

                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                            <button type="button" onClick={() => setAdminPlays("yes")} className={`px-6 py-2 rounded text-xs font-black uppercase transition-all ${adminPlays === "yes" ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-white"}`}>Sim, vou jogar</button>
                            <button type="button" onClick={() => setAdminPlays("no")} className={`px-6 py-2 rounded text-xs font-black uppercase transition-all ${adminPlays === "no" ? "bg-red-500 text-white shadow-lg" : "text-gray-500 hover:text-white"}`}>Apenas organizar</button>
                        </div>
                    </div>

                    {/* BOTÃO SUBMIT */}
                    <div className="pt-6 border-t border-white/5">
                        <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.01] disabled:opacity-50 uppercase tracking-wide flex items-center justify-center gap-2">
                            {loading ? "Criando Liga..." : "FUNDAR LIGA AGORA ➜"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}