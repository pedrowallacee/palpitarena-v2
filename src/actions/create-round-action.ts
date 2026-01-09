'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createRound(formData: FormData) {
    // 1. Pegar o Slug do campeonato (que virá num campo escondido)
    const slug = formData.get("slug") as string
    const name = formData.get("name") as string
    const deadlineString = formData.get("deadline") as string

    // 2. Validar
    if (!slug || !name || !deadlineString) return

    // 3. Buscar o ID do campeonato usando o slug
    const championship = await prisma.championship.findUnique({
        where: { slug }
    })

    if (!championship) {
        console.error("Campeonato não encontrado")
        return
    }

    // 4. Criar a Rodada
    await prisma.round.create({
        data: {
            name,
            deadline: new Date(deadlineString), // Converte o texto do input para Data Real
            championshipId: championship.id,
            status: "SCHEDULED"
        }
    })

    // 5. Atualizar a tela anterior (para a rodada aparecer na lista lá)
    revalidatePath(`/campeonatos/${slug}`)

    // 6. Voltar para a página do campeonato
    redirect(`/campeonatos/${slug}`)
}