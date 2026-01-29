'use client'

import { useState } from "react"
import { Copy, Check, Users, ShieldAlert } from "lucide-react"

interface AdminPredictionStatusProps {
    participants: any[]
    round: any
}

export function AdminPredictionStatus({ participants, round }: AdminPredictionStatusProps) {
    const [copied, setCopied] = useState(false)

    // Filtra quem NÃO palpitou ainda (quem não tem palpites na rodada)
    // Regra: Considera que palpitou se tiver pelo menos 1 palpite registrado na rodada
    const missingParticipants = participants.filter(p => {
        // Se o usuário não existe (time sem dono), ignora
        if (!p.user) return false;

        // Verifica se existe algum palpite desse usuário NOS JOGOS DA RODADA
        const hasPredicted = round.matches.some((m: any) =>
            m.predictions.some((pred: any) => pred.userId === p.userId)
        )

        return !hasPredicted
    })

    const missingNames = missingParticipants.map(p => p.user.name || p.teamName)

    const handleCopyMissing = () => {
        const link = `https://palpitarena-v2.vercel.app/campeonatos/${round.championship.slug}/rodada/${round.id}`

        const text = `
🚨 *ATENÇÃO TREINADORES!* 🚨
🏆 *${round.championship.name}*
📅 *${round.name}*

⏳ *O MERCADO FECHA EM BREVE!*
Não deixe para a última hora, evite o W.O.

👇 *Ainda não palpitaram:*
${missingNames.map(n => `❌ ${n}`).join("\n")}

🔗 *FAÇA SEU JOGO AGORA:*
${link}
`
        navigator.clipboard.writeText(text.trim())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (missingParticipants.length === 0) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-emerald-500 text-black p-2 rounded-full">
                    <Check className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-emerald-400 font-bold uppercase text-sm">Tudo Pronto!</h3>
                    <p className="text-xs text-gray-400">Todos os treinadores já enviaram seus palpites.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-orange-500" />
                    <div>
                        <h3 className="text-white font-bold uppercase text-sm">Faltam Palpitar</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                            {missingParticipants.length} Treinadores Pendentes
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleCopyMissing}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all active:scale-95 group"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Copiado</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 text-gray-400 group-hover:text-white" />
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase">Copiar Lista</span>
                        </>
                    )}
                </button>
            </div>

            {/* Lista Visual (Scroll Horizontal se for muito grande) */}
            <div className="flex flex-wrap gap-2">
                {missingParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-black/40 border border-white/5 px-2 py-1 rounded-full pr-3">
                        <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                            {p.teamLogo ? (
                                <img src={p.teamLogo} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-[8px] font-bold text-gray-500">{p.teamName?.charAt(0)}</span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{p.user?.name.split(" ")[0]}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}