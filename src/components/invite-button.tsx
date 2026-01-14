'use client'

import { useState } from "react"

interface InviteButtonProps {
    slug: string
    code: string // <--- ADICIONAMOS AQUI O TIPO
}

export function InviteButton({ slug, code }: InviteButtonProps) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        // Cria o link completo de convite
        // Se estiver rodando local, window.location.origin é localhost
        // Se estiver na Vercel, é o domínio do site
        const link = `${window.location.origin}/entrar?code=${code}`

        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="h-10 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
        >
            {copied ? (
                <>
                    <span>✅</span> Copiado!
                </>
            ) : (
                <>
                    <span>🔗</span> Copiar Link
                </>
            )}
        </button>
    )
}