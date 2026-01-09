'use client'

import { useState } from "react"

export function InviteButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false)

    function copyLink() {
        const link = `${window.location.origin}/convite/${slug}`
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={copyLink}
            className={`
        px-6 py-3 border rounded font-bold transition-all flex items-center gap-2
        ${copied
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-emerald-400 hover:text-emerald-300'
            }
      `}
        >
            {copied ? 'LINK COPIADO! 📋' : '🔗 CONVIDAR AMIGOS'}
        </button>
    )
}