'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Função simples para gerar código de 6 letras (Ex: X9A2B)
function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Função para gerar Slug (URL amigável)
function generateSlug(name: string) {
    return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
            .replace(/\s+/g, "-") // Troca espaço por traço
        + "-" + Math.floor(Math.random() * 1000) // Adiciona número para garantir unicidade
}

export async function requestChampionshipAction(formData: FormData) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) {
        return { success: false, message: "Você precisa estar logado." }
    }

    // 1. Coletar dados do Formulário
    const name = formData.get("name") as string
    const leagueType = formData.get("leagueType") as string // <--- OBRIGATÓRIO AGORA
    const whatsapp = formData.get("whatsapp") as string
    const format = formData.get("format") as string
    const maxParticipants = formData.get("maxParticipants") as string
    const adminParticipates = formData.get("adminParticipates") as string

    // Validação básica
    if (!name || !leagueType || !format) {
        return { success: false, message: "Preencha os campos obrigatórios (Nome, Liga e Formato)." }
    }

    try {
        // 2. Gerar dados automáticos
        const slug = generateSlug(name)
        const code = generateInviteCode() // <--- OBRIGATÓRIO AGORA

        // 3. Criar o Campeonato no Banco
        const championship = await prisma.championship.create({
            data: {
                name,
                slug,
                description: `Campeonato de ${leagueType} organizado pelo Admin.`, // Descrição padrão
                leagueType,         // <--- CORREÇÃO DO ERRO
                code,               // <--- CORREÇÃO DO ERRO
                format: format as any, // Garante que bate com o Enum (POINTS, KNOCKOUT, etc)
                maxParticipants: parseInt(maxParticipants) || 20,
                adminPhone: whatsapp,
                ownerId: userId,
                status: "ACTIVE", // Já cria como ativo

                // Configurações padrão baseadas no formato
                hasGroupStage: format === 'GROUPS',
                hasKnockout: format === 'KNOCKOUT' || format === 'GROUPS'
            }
        })

        // 4. Se o Admin marcou que vai jogar, adiciona ele como participante
        if (adminParticipates === "yes") {
            // Busca dados do usuário para pegar o nome
            const user = await prisma.user.findUnique({ where: { id: userId } })

            await prisma.championshipParticipant.create({
                data: {
                    userId: userId,
                    championshipId: championship.id,
                    teamName: user?.name || "Time do Admin", // Nome padrão inicial
                    // teamLogo: user?.image // Opcional: já usar a foto dele
                }
            })
        }

        revalidatePath("/dashboard")
        return { success: true, redirectUrl: `/campeonatos/${slug}` }

    } catch (error) {
        console.error("Erro ao criar campeonato:", error)
        return { success: false, message: "Erro ao criar campeonato. Tente outro nome." }
    }
}