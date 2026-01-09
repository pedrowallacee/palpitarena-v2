'use client'

import { loginUser } from "@/actions/auth-actions"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = (await loginUser(formData)) as { success: boolean, message: string }
        setLoading(false)

        if (result?.success) {
            router.push("/dashboard") // Vai para o painel principal
            router.refresh()
        } else {
            alert("❌ " + (result?.message || "Erro ao entrar"))
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                 style={{ backgroundImage: "url('https://wallpapers.com/images/hd/720p-sports-background-1275-x-704-x8qi0yyjkcubnw5s.jpg')" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-emerald-900/40" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8 m-4 animate-in zoom-in duration-500">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" />

                <div className="relative z-20">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-white italic tracking-tighter">
                            ACESSAR <span className="text-emerald-500">ÁREA TÉCNICA</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">Entre para gerenciar seu time.</p>
                    </div>

                    <form action={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Email</label>
                            <input name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" required />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide ml-1">Senha</label>
                            </div>
                            <input name="password" type="password" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" required />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-black text-lg rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02] disabled:opacity-50"
                        >
                            {loading ? "ENTRANDO..." : "ENTRAR EM CAMPO ➜"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-500">
                            Ainda não tem time? <Link href="/cadastro" className="text-emerald-400 font-bold hover:text-emerald-300">Criar Conta</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}