import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CreateRoundForm } from "@/components/create-round-form" // Agora vai funcionar!

export default async function NovaRodadaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // Busca campeonato para pegar o ID e verificar dono
    const championship = await prisma.championship.findUnique({
        where: { slug },
        select: { id: true, ownerId: true, slug: true }
    })

    if (!championship) redirect("/dashboard")

    // Busca usuário para ver se é Admin
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    // Permissão: Só Dono ou Admin pode criar rodada
    const isOwner = championship.ownerId === userId
    const isAdmin = user?.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
        redirect(`/campeonatos/${slug}`)
    }

    return (
        <CreateRoundForm
            championshipId={championship.id}
            championshipSlug={championship.slug}
        />
    )
}