'use client'

import { useState } from "react"

interface AdminPredictionStatusProps {
    participants: any[]
    round: any
}

export function AdminPredictionStatus({ participants, round }: AdminPredictionStatusProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const totalMatches = round.matches.length

    // Processa os dados para saber o status de cada um
    const statusList = participants.map(p => {
        // Conta quantos palpites esse usuário tem nos jogos desta rodada
        const predictionsCount = round.matches.reduce((acc: number, match: any) => {
            const hasPrediction = match.predictions.some((pred: any) => pred.userId === p.userId)
            return acc + (hasPrediction ? 1 : 0)
        }, 0)

        return {
            name: p.user.name || "Sem Nome",
            count: predictionsCount,
            isComplete: predictionsCount === totalMatches,
            isMissing: predictionsCount === 0
        }
    })

    // Separa os pendentes para gerar o texto
    const missingPeople = statusList.filter(p => !p.isComplete)

    function handleCopyList() {
        const header = `📢 *FALTA PALPITAR NA ${round.name.toUpperCase()}!* 📢\n\n`
        const list = missingPeople.map(p => {
            if (p.count === 0) return `- ${p.name} (Falta tudo ❌)`
            return `- ${p.name} (Faltam ${totalMatches - p.count} jogos ⚠️)`
        }).join("\n")

        const footer = `\n\nCorre lá: https://palpitarena.com/` // Troque pelo seu domínio se quiser

        const fullText = header + list + footer

        navigator.clipboard.writeText(fullText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500">
                        👮‍♂️
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-white uppercase">Controle de Palpites</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">
                            {missingPeople.length} pendentes de {participants.length} treinadores
                        </p>
                    </div>
                </div>
                <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">

                    {/* Botão de Copiar */}
                    {missingPeople.length > 0 && (
                        <button
                            onClick={handleCopyList}
                            className="w-full mb-4 bg-green-600 hover:bg-green-500 text-white font-bold uppercase text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {copied ? "✅ Lista Copiada!" : "📋 Copiar Lista de Cobrança (WhatsApp)"}
                        </button>
                    )}

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {statusList.sort((a, b) => a.count - b.count).map((status, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded border border-white/5 bg-white/5">
                                <span className="text-xs font-bold text-gray-300 truncate max-w-[150px]">
                                    {status.name}
                                </span>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-gray-500">
                                        {status.count}/{totalMatches}
                                    </span>
                                    {status.isComplete ? (
                                        <span className="text-emerald-500 text-xs" title="Completo">✅</span>
                                    ) : status.isMissing ? (
                                        <span className="text-red-500 text-xs" title="Não palpitou nada">❌</span>
                                    ) : (
                                        <span className="text-yellow-500 text-xs" title="Incompleto">⚠️</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}