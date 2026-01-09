'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function joinChampionship(slug: string) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    // Se não tiver logado, manda pro login e avisa pra voltar aqui depois
    if (!userId) {
        redirect(`/login?callbackUrl=/convite/${slug}`)
    }

    // 1. Acha o campeonato pelo link (slug)
    const championship = await prisma.championship.findUnique({
        where: { slug }
    })

    if (!championship) return { error: "Campeonato não encontrado" }

    // 2. Verifica se já é membro (pra não dar erro)
    const existingMember = await prisma.championshipMember.findUnique({
        where: {
            userId_championshipId: {
                userId,
                championshipId: championship.id
            }
        }
    })

    // 3. Se não for membro, CRIA O VÍNCULO!
    if (!existingMember) {
        await prisma.championshipMember.create({
            data: {
                userId,
                championshipId: championship.id
            }
        })
    }

    // 4. Joga o cara pra dentro da arena
    redirect(`/campeonatos/${slug}`)
}