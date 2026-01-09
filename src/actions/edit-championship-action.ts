'use server'

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function editChampionship(formData: FormData) {
    const id = formData.get("id") as string
    const slug = formData.get("slug") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    await prisma.championship.update({
        where: { id },
        data: { name, description }
    })

    revalidatePath(`/campeonatos/${slug}`)
    redirect(`/campeonatos/${slug}`)
}