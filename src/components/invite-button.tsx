'use client'

import { useState } from "react"

export function InviteButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        // Pega a URL base do navegador
        const url = `${window.location.origin}/convite/${slug}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wide transition-all active:scale-95"
        >
            {copied ? (
                <span className="text-emerald-400">Copiado! ✅</span>
            ) : (
                <span className="text-gray-300">🔗 Copiar Link de Convite</span>
            )}
        </button>
    )
}