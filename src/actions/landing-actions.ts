'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { ChampionshipFormat } from "@prisma/client"

const LEAGUE_IDS: Record<string, number> = {
    "Brasileirão Série A": 71, "Copa do Brasil": 73,
    "Premier League": 39, "Serie A Tim": 135, "La Liga": 140, "Bundesliga": 78, "Ligue 1": 61, "Liga Portugal": 94, "Eredivisie": 88,
    "Liga Profissional Arg": 128, "MLS": 253, "Saudi Pro League": 307, "Liga All Stars": 292,
    "Champions League": 2, "Europa League": 3, "Libertadores": 13, "Mundial de Clubes": 15, "Copa do Mundo": 1
}

function generateSlug(text: string) {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .concat(`-${Math.floor(Math.random() * 1000)}`)
}

function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function requestChampionshipAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value
    if (!userId) return { success: false, message: "Faça login primeiro." }

    const name = formData.get("name") as string
    const leagueType = formData.get("leagueType") as string
    const whatsapp = formData.get("whatsapp") as string
    const maxParticipants = parseInt(formData.get("maxParticipants") as string) || 20
    const rawFormat = formData.get("format") as string
    const format = (rawFormat === "KNOCKOUT" || rawFormat === "GROUPS") ? rawFormat : "POINTS" as ChampionshipFormat
    const adminParticipates = formData.get("adminParticipates") === "yes"

    if (!name || !leagueType || !whatsapp) return { success: false, message: "Preencha todos os campos." }

    const apiLeagueId = LEAGUE_IDS[leagueType] || 71

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (user?.role === 'ADMIN') {
            const slug = generateSlug(name)
            const code = generateInviteCode()

            await prisma.championship.create({
                data: {
                    name, slug, code, leagueType, status: 'ACTIVE',
                    adminPhone: whatsapp, ownerId: user.id,
                    apiLeagueId: apiLeagueId, format: format,
                    maxParticipants: maxParticipants
                }
            })

            if (adminParticipates) {
                return { success: true, message: "Liga criada! Escolha seu time.", redirectUrl: `/campeonatos/${slug}/escolher-time` }
            } else {
                return { success: true, message: "Liga criada com sucesso!", redirectUrl: `/campeonatos/${slug}` }
            }
        }

        await prisma.championshipRequest.create({
            data: { userId, name, leagueType, whatsapp, status: 'PENDING' }
        })

        return { success: true, message: "Solicitação enviada!" }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro interno." }
    }
}

export async function findLeagueAction(formData: FormData) {
    const slug = formData.get("slug") as string
    if (!slug) return { success: false, message: "Digite o código." }

    const camp = await prisma.championship.findFirst({
        where: {
            OR: [
                { slug: slug },
                { code: slug.toUpperCase() }
            ]
        }
    })

    if (camp) {
        return { success: true, message: "Liga encontrada!", redirectUrl: `/convite/${camp.slug}` }
    }

    return { success: false, message: "Liga não encontrada." }
}