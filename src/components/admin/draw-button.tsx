'use client'

import { drawGroupsAction } from "@/actions/draw-groups"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

export function DrawGroupsButton({ championshipId }: { championshipId: string }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleDraw = () => {
        if(!confirm("Tem certeza? Isso vai sortear os grupos e iniciar a fase de grupos!")) return;

        startTransition(async () => {
            await drawGroupsAction(championshipId)
            router.refresh()
        })
    }

    return (
        <button
            onClick={handleDraw}
            disabled={isPending}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:border-[#a3e635]/50 group"
        >
            {isPending ? "Sorteando..." : (
                <>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#a3e635]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                    <span className="font-bold">REALIZAR SORTEIO DOS GRUPOS</span>
                </>
            )}
        </button>
    )
}