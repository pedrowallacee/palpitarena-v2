import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

// AÇÃO DE CONFIRMAÇÃO
async function confirmRescueAction(formData: FormData) {
    'use server'
    const participantId = formData.get("participantId") as string
    const userId = formData.get("userId") as string

    // 1. Busca o time para ver de qual campeonato é
    const participant = await prisma.championshipParticipant.findUnique({
        where: { id: participantId },
        include: { championship: true }
    })

    if (!participant) return

    // 2. Associa o novo usuário ao time
    await prisma.championshipParticipant.update({
        where: { id: participantId },
        data: { userId: userId }
    })

    // 3. Redireciona para o campeonato
    redirect(`/campeonatos/${participant.championship.slug}`)
}

export default async function ResgatarTimePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params // ID do Participante (Time)
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) {
        // Se não tiver logado, manda pro login e depois volta pra cá
        redirect(`/login?callbackUrl=/resgatar/${id}`)
    }

    // Busca o time abandonado
    const participant = await prisma.championshipParticipant.findUnique({
        where: { id },
        include: { championship: true }
    })

    if (!participant) return <div>Time não encontrado.</div>

    // Se o time já tiver dono, avisa
    if (participant.userId) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Ops! Tarde demais.</h1>
                    <p className="text-gray-400">Esse time já foi resgatado por outra pessoa.</p>
                    <Link href="/dashboard" className="block mt-4 text-emerald-500 underline">Ir para meu painel</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-white p-4">
            <div className="max-w-md w-full bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl shadow-2xl text-center">

                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-500/20">
                    Convite de Emergência
                </span>

                <h1 className="text-3xl font-black italic font-teko uppercase mt-4">
                    ASSUMIR O <span className="text-emerald-500">{participant.teamName}</span>?
                </h1>

                <div className="my-6 flex justify-center">
                    {participant.teamLogo ? (
                        <img src={participant.teamLogo} className="w-24 h-24 object-contain drop-shadow-xl" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-3xl">⚽</div>
                    )}
                </div>

                <div className="bg-[#0f0f0f] p-4 rounded-lg mb-6 border border-white/5">
                    <p className="text-gray-400 text-sm mb-1">Situação Atual:</p>
                    <div className="flex justify-center gap-6">
                        <div>
                            <span className="block text-2xl font-bold text-white">{participant.points}</span>
                            <span className="text-[10px] uppercase text-gray-500 font-bold">Pontos</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-white">{participant.matchesPlayed}</span>
                            <span className="text-[10px] uppercase text-gray-500 font-bold">Jogos</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                    Ao confirmar, você herdará todo o histórico, pontos e palpites passados deste time na liga <strong>{participant.championship.name}</strong>.
                </p>

                <form action={confirmRescueAction}>
                    <input type="hidden" name="participantId" value={participant.id} />
                    <input type="hidden" name="userId" value={userId} />
                    <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-wide shadow-lg hover:shadow-emerald-500/20 transition-all">
                        🚀 Confirmar e Assumir
                    </button>
                </form>

                <Link href="/dashboard" className="block mt-4 text-xs text-gray-500 hover:text-white uppercase font-bold">
                    Cancelar
                </Link>
            </div>
        </div>
    )
}