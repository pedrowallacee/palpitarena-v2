'use client'

import { deleteChampionship } from "@/actions/delete-championship-action"
import { useState } from "react"

interface DeleteButtonProps {
    id: string
    name: string // Agora precisamos do nome para validar
}

export function DeleteChampionshipButton({ id, name }: DeleteButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)

    const isMatch = inputValue === name

    async function handleDelete() {
        if (!isMatch) return
        setLoading(true)
        await deleteChampionship(id)
    }

    return (
        <>
            {/* 1. O BOTÃO VERMELHO (Abre o Modal) */}
            <button
                onClick={() => setIsOpen(true)}
                className="px-6 py-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded font-bold transition-colors text-red-400 hover:text-red-300"
            >
                🗑️ Excluir Liga
            </button>

            {/* 2. O MODAL DE SEGURANÇA (Só aparece se isOpen = true) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                    {/* Fundo Escuro (Clica fora pra fechar) */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Janela do Modal */}
                    <div className="relative bg-[#0f172a] border border-red-500/30 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">

                        <h2 className="text-xl font-black text-white mb-2">⚠️ ZONA DE PERIGO</h2>

                        <p className="text-gray-400 text-sm mb-6">
                            Você está prestes a excluir o campeonato <strong className="text-white">"{name}"</strong>.
                            <br/><br/>
                            Isso apagará permanentemente todas as rodadas, jogos, palpites e ranking. <span className="text-red-400 font-bold">Essa ação não tem volta.</span>
                        </p>

                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                            Digite <span className="select-all text-white bg-white/10 px-1 rounded mx-1">{name}</span> para confirmar:
                        </label>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={name}
                            className="w-full bg-black/40 border border-white/20 rounded p-3 text-white focus:border-red-500 focus:outline-none mb-6"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded font-bold text-sm text-gray-400 transition-colors"
                            >
                                CANCELAR
                            </button>

                            <button
                                onClick={handleDelete}
                                disabled={!isMatch || loading}
                                className={`
                  flex-1 py-3 rounded font-bold text-sm transition-all
                  ${isMatch
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                                    : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                `}
                            >
                                {loading ? "EXCLUINDO..." : "QUERO EXCLUIR"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}