'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// --- FUNÇÕES AUXILIARES ---

// Gera um código de convite único (Ex: X9A2B)
function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Gera URL amigável (Ex: "premier-league-do-pedro-123")
function generateSlug(name: string) {
    return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
            .replace(/\s+/g, "-") // Troca espaço por traço
        + "-" + Math.floor(Math.random() * 1000) // Adiciona número aleatório
}

// --- ACTION PRINCIPAL ---

export async function createChampionshipAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) {
        return { success: false, message: "Você precisa estar logado." }
    }

    // 1. Coletar dados do Formulário
    const name = formData.get("name") as string
    const leagueType = formData.get("leagueType") as string
    const whatsapp = formData.get("whatsapp") as string
    const format = formData.get("format") as string
    const maxParticipants = formData.get("maxParticipants") as string
    const adminParticipates = formData.get("adminParticipates") as string

    // Validação simples
    if (!name || !leagueType || !format) {
        return { success: false, message: "Preencha os campos obrigatórios." }
    }

    try {
        // 2. Preparar dados
        const slug = generateSlug(name)
        const code = generateInviteCode()
        const limit = parseInt(maxParticipants) || 20

        // 3. Buscar dados do usuário (para pegar o nome dele se for jogar)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, image: true }
        })

        if (!user) return { success: false, message: "Usuário não encontrado." }

        // 4. CRIAR O CAMPEONATO (VOCÊ COMO DONO)
        const championship = await prisma.championship.create({
            data: {
                name,
                slug,
                description: `Campeonato de ${leagueType} organizado por ${user.name}.`,
                leagueType,
                code,
                format: format as any, // Garante compatibilidade com o Enum do banco
                maxParticipants: limit,
                adminPhone: whatsapp,
                ownerId: userId, // <--- AQUI ESTÁ O PODER DE ADMIN
                status: "ACTIVE", // O Campeonato tem status, isso está correto.

                // Configurações lógicas
                hasGroupStage: format === 'GROUPS' || format === 'CUP',
                hasKnockout: format === 'KNOCKOUT' || format === 'CUP' || format === 'GROUPS'
            }
        })

        // 5. INSERIR O ADMIN COMO JOGADOR (SE ELE QUISER)
        if (adminParticipates === "yes") {
            await prisma.championshipParticipant.create({
                data: {
                    userId: userId,
                    championshipId: championship.id,
                    teamName: user.name || "Time do Admin",
                    teamLogo: user.image,
                }
            })
        }

        // 6. Atualizar Cache e Retornar
        revalidatePath("/dashboard")
        return { success: true, redirectUrl: `/campeonatos/${slug}` }

    } catch (error) {
        console.error("Erro ao criar campeonato:", error)
        return { success: false, message: "Erro interno. Tente um nome diferente." }
    }
}