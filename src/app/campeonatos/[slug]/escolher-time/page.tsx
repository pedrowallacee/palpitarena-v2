import { prisma } from "@/lib/prisma"
import { getTeamsByLeague } from "@/services/football-api"
import { TeamSelector } from "@/components/team-selector"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function EscolherTimePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 1. Busca dados do campeonato E OS PARTICIPANTES JÁ CADASTRADOS
    const championship = await prisma.championship.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            apiLeagueId: true,
            leagueType: true, // <--- NOVO: Precisamos saber o tipo da liga (All Stars?)
            participants: {
                select: {
                    teamApiId: true,
                    user: { select: { name: true } }
                }
            }
        },
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    // 2. Verifica se EU já participo
    const existingParticipation = await prisma.championshipParticipant.findFirst({
        where: {
            userId: userId,
            championshipId: championship.id
        }
    })

    if (existingParticipation) {
        redirect(`/campeonatos/${slug}`)
    }

    // 3. Monta um "Mapa" de times ocupados
    // Ex: { 40: "Pedro", 50: "João" }
    const takenTeamsMap: Record<number, string> = {}

    championship.participants.forEach(p => {
        if (p.teamApiId) {
            // Se o user for null (time abandonado), mostramos "Sem Técnico"
            takenTeamsMap[p.teamApiId] = p.user?.name || "Abandonado"
        }
    })

    // 4. Busca times da API
    // Se for All Stars, ainda buscamos uma lista padrão (71 - Brasileirão) só pra não ficar vazio de início,
    // mas o TeamSelector vai avisar que pode buscar qualquer coisa.
    const leagueId = championship.apiLeagueId || 71
    console.log(`🔍 Buscando times para Liga ID: ${leagueId}`)
    const teams = await getTeamsByLeague(leagueId)

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-6 pb-32">

            <div className="max-w-4xl mx-auto text-center mb-8 animate-in slide-in-from-top-4">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">
                    {championship.name}
                </p>
                <h1 className="text-5xl md:text-6xl font-black italic font-teko text-white uppercase leading-none">
                    ESCOLHA SEU <span className="text-emerald-500">ESCUDO</span>
                </h1>

                {teams.length === 0 ? (
                    <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <h3 className="text-xl font-bold text-red-400 mb-2">Nenhum time encontrado! 😕</h3>
                        <p className="text-sm text-gray-300">Verifique se a temporada da API está correta.</p>
                    </div>
                ) : (
                    <p className="text-gray-500 mt-2 max-w-lg mx-auto">
                        Os times em cinza já foram escolhidos por outros treinadores.
                    </p>
                )}
            </div>

            {/* Passando leagueType para ativar o modo All Stars se necessário */}
            {teams.length > 0 && (
                <TeamSelector
                    teams={teams}
                    championshipId={championship.id}
                    takenTeams={takenTeamsMap}
                    leagueType={championship.leagueType || ""} // <--- AQUI A MUDANÇA
                />
            )}
        </div>
    )
}