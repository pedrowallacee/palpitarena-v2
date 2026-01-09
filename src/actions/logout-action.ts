'use server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logoutUser() {
    const cookieStore = await cookies()

    // Apaga o crachá de acesso
    cookieStore.delete("palpita_session")

    // Manda o usuário para a rua (Home)
    redirect("/")
}