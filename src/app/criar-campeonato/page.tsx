import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CreateLeagueForm } from "@/components/create-league-form" // Importa o formulário

export default async function CreateLeaguePage() {
    // 1. Pega a sessão
    const cookieStore = await cookies()
    const userId = cookieStore.get("palpita_session")?.value

    if (!userId) redirect("/login")

    // 2. Busca o usuário para ver a Role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true } // Só precisamos saber a role
    })

    // 3. SEGURANÇA: Se não for ADMIN, manda de volta pro painel
    if (!user || user.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    // 4. Se for Admin, mostra o formulário
    return <CreateLeagueForm />
}