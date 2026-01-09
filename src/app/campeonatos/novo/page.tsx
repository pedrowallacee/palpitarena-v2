import { createChampionship } from "@/actions/create-championship-action"
import Link from "next/link"

export default function NewChampionshipPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* 1. FUNDO DE ESTÁDIO */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=3870&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            </div>

            {/* 2. CARD DE CRIAÇÃO */}
            <div className="relative z-10 w-full max-w-lg p-8 m-4">

                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-2xl animate-in zoom-in duration-500">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white italic tracking-tighter">
                            CRIAR <span className="text-emerald-500">LIGA</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">Dê um nome para a sua arena.</p>
                    </div>

                    <form action={createChampionship} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Nome do Campeonato</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Ex: Brasileirão da Firma, Copa dos Amigos..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all text-lg"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Descrição (Opcional)</label>
                            <textarea
                                name="description"
                                placeholder="Regras, premiação ou zoação..."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02]"
                        >
                            FUNDAR CAMPEONATO 🏆
                        </button>

                        <Link href="/dashboard" className="block text-center text-sm text-gray-500 hover:text-white transition-colors">
                            Cancelar e voltar
                        </Link>

                    </form>
                </div>

            </div>
        </div>
    )
}