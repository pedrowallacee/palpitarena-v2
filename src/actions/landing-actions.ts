'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// 1. AÇÃO DE SOLICITAR CAMPEONATO (Para o Admin Aprovar)
export async function requestChampionshipAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) return { success: false, message: "Faça login para solicitar." }

    const name = formData.get("name") as string
    const whatsapp = formData.get("whatsapp") as string
    const leagueType = formData.get("leagueType") as string

    if (!name || !whatsapp) return { success: false, message: "Preencha os campos obrigatórios." }

    try {
        await prisma.championshipRequest.create({
            data: {
                name,
                whatsapp,
                leagueType,
                userId
            }
        })
        return { success: true, message: "Solicitação enviada! O Admin analisará seu pedido." }
    } catch (e) {
        return { success: false, message: "Erro ao enviar solicitação." }
    }
}

// 2. AÇÃO DE ENTRAR NA LIGA (Busca pelo Slug)
export async function findLeagueAction(formData: FormData) {
    const slug = formData.get("slug") as string

    if (!slug) return { success: false, message: "Digite o código/link da liga." }

    const championship = await prisma.championship.findUnique({
        where: { slug: slug.trim() } // Remove espaços
    })

    if (!championship) {
        return { success: false, message: "Campeonato não encontrado." }
    }

    // Se achou, redireciona para a tela de escolher time que criamos antes
    redirect(`/campeonatos/${championship.slug}/escolher-time`)
}