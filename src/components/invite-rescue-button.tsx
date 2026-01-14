'use client'

import { useState } from "react"

export function InviteRescueButton({ participantId, teamName }: { participantId: string, teamName: string }) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        // Gera o link para a página de resgate
        const url = `${window.location.origin}/resgatar/${participantId}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            type="button"
            className="flex-1 md:flex-none bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-4 py-3 rounded uppercase transition-colors flex items-center justify-center gap-2"
        >
            {copied ? "Link Copiado! ✅" : `🔗 Link para assumir ${teamName}`}
        </button>
    )
}