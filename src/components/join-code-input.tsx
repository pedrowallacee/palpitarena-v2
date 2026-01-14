'use client'

import { useState } from "react"
import { joinByCodeAction } from "@/actions/join-by-code" // Certifique que está importando do arquivo certo
import { useRouter } from "next/navigation"

export function JoinCodeInput() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await joinByCodeAction(formData)

        if (res.success && res.redirectUrl) {
            // SUCESSO: Redireciona (Não mostra alert!)
            router.push(res.redirectUrl)
        } else {
            // ERRO: Mostra alert e para o loading
            setLoading(false)
            alert("❌ " + res.message)
        }
    }

    return (
        <form action={handleSubmit} className="w-full flex flex-col gap-3">
            <input
                name="code"
                type="text"
                placeholder="CÓDIGO (Ex: X9A2B)"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-4 py-3 text-white uppercase font-bold placeholder:text-gray-600 focus:border-emerald-500 outline-none text-center tracking-widest text-xl"
                maxLength={6}
                required
            />
            <button
                disabled={loading}
                className="w-full bg-white hover:bg-gray-200 text-black font-black px-6 py-3 rounded-lg uppercase transition-colors disabled:opacity-50"
            >
                {loading ? "BUSCANDO..." : "BUSCAR LIGA"}
            </button>
        </form>
    )
}