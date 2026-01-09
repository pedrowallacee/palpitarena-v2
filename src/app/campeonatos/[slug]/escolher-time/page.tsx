import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getTeamsByLeague } from "@/services/football-api" // Sua função de API
import { TeamSelector } from "@/components/team-selector"
import { cookies } from "next/headers"

export default async function ChooseTeamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // 1. Auth Check
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) redirect("/login")

    // 2. Busca Campeonato e quem já está nele
    const championship = await prisma.championship.findUnique({
        where: { slug },
        include: {
            participants: {
                include: { user: true } // Precisamos do nome do usuário
            }
        }
    })

    if (!championship || !championship.apiLeagueId) return notFound()

    // 3. Verifica se usuário já está participando (se sim, redireciona pro dashboard)
    const alreadyJoined = championship.participants.some(p => p.userId === userId)
    if (alreadyJoined) {
        redirect(`/campeonatos/${slug}`)
    }

    // 4. Busca TODOS os times da liga na API Externa
    const allTeams = await getTeamsByLeague(championship.apiLeagueId)

    // 5. Mapeia quem já pegou qual time
    // Cria uma lista simples com { teamApiId: 127, ownerName: "Pedro W." }
    const takenTeams = championship.participants
        .filter(p => p.teamApiId !== null)
        .map(p => ({
            teamApiId: p.teamApiId,
            ownerName: p.user.name.split(' ').slice(0, 2).join(' ') // Pega Primeiro + Segundo nome
        }))

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
            <header className="max-w-6xl mx-auto mb-8 text-center md:text-left">
                <h1 className="text-4xl font-bold font-['Teko'] uppercase">Escolha seu Time</h1>
                <p className="text-gray-400">
                    Selecione o clube que você representará na
                    <span className="text-[#a3e635] font-bold ml-1">{championship.name}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-2">Times cinzas já foram escolhidos por outros treinadores.</p>
            </header>

            <main className="max-w-6xl mx-auto">
                <TeamSelector
                    championshipId={championship.id}
                    availableTeams={allTeams}
                    takenTeams={takenTeams}
                />
            </main>
        </div>
    )
}