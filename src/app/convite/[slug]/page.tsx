import { prisma } from "@/lib/prisma"
import { joinChampionship } from "@/actions/join-championship-action"
import Link from "next/link"

export default async function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            owner: true,
            _count: { select: { members: true } }
        }
    })

    if (!championship) return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <h1>Convite inválido ou expirado. 😕</h1>
        </div>
    )

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
            {/* Fundo */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80')] bg-cover bg-center opacity-30 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent" />

            <div className="relative z-10 max-w-md w-full p-6 text-center">

                {/* Avatar do Dono */}
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 animate-in zoom-in duration-500">
          <span className="text-4xl font-black text-black">
            {championship.owner.name.charAt(0).toUpperCase()}
          </span>
                </div>

                <h2 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">
                    VOCÊ FOI CONVOCADO POR {championship.owner.name.split(" ")[0].toUpperCase()}
                </h2>

                <h1 className="text-4xl md:text-5xl font-black italic text-white mb-4 leading-tight">
                    {championship.name}
                </h1>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 backdrop-blur-md">
                    <p className="text-gray-300 italic">
                        "{championship.description || 'Venha mostrar que você entende de futebol!'}"
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400 font-bold">
                        👥 {championship._count.members} Participantes já estão na arena
                    </div>
                </div>

                <form action={joinChampionship.bind(null, slug)}>
                    <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xl rounded-lg shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                        ACEITAR DESAFIO ⚽
                    </button>
                </form>

                <Link href="/" className="block mt-6 text-gray-500 hover:text-white text-sm transition-colors">
                    Não, obrigado. Vou ficar no banco.
                </Link>

            </div>
        </div>
    )
}