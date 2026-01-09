import { prisma } from "@/lib/prisma"
import { editChampionship } from "@/actions/edit-championship-action"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function EditChampionshipPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const championship = await prisma.championship.findUnique({
        where: { slug }
    })

    if (!championship) redirect("/dashboard")

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">

                <h1 className="text-2xl font-black italic mb-6">⚙️ EDITAR LIGA</h1>

                <form action={editChampionship} className="space-y-6">
                    <input type="hidden" name="id" value={championship.id} />
                    <input type="hidden" name="slug" value={championship.slug} />

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Nome do Campeonato</label>
                        <input
                            name="name"
                            defaultValue={championship.name}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                        <textarea
                            name="description"
                            defaultValue={championship.description || ""}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white mt-1 h-32"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Link href={`/campeonatos/${slug}`} className="flex-1 py-3 bg-white/10 text-center rounded font-bold text-sm">
                            CANCELAR
                        </Link>
                        <button className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded shadow-lg hover:bg-emerald-400">
                            SALVAR ALTERAÇÕES
                        </button>
                    </div>
                </form>

            </div>
        </div>
    )
}