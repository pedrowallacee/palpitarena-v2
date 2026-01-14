'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function joinByCodeAction(formData: FormData) {
    const code = formData.get("code") as string

    if (!code) {
        return { success: false, message: "Digite o código." }
    }

    try {
        // 1. Busca a liga pelo código (Case Insensitive)
        const championship = await prisma.championship.findUnique({
            where: { code: code.toUpperCase() },
            select: { slug: true }
        })

        if (!championship) {
            return { success: false, message: "Código inválido. Liga não encontrada." }
        }

        // 2. Verifica se está logado
        const cookieStore = await cookies()
        const userId = cookieStore.get("palpita_session")?.value

        // URL de destino (Página de escolher time da liga encontrada)
        const inviteUrl = `/campeonatos/${championship.slug}/escolher-time`

        // 3. Lógica de Redirecionamento
        if (!userId) {
            // SE NÃO TIVER LOGADO -> Manda pro Login com callback
            return {
                success: true,  // <--- ISSO PRECISA SER TRUE
                redirectUrl: `/login?callbackUrl=${encodeURIComponent(inviteUrl)}`
            }
        }

        // SE JÁ TIVER LOGADO -> Manda direto pra liga
        return {
            success: true, // <--- ISSO PRECISA SER TRUE
            redirectUrl: inviteUrl
        }

    } catch (error) {
        console.error(error)
        return { success: false, message: "Erro interno ao buscar liga." }
    }
}