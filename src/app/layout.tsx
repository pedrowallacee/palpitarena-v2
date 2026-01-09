import type { Metadata } from "next";
import { Teko, Inter } from "next/font/google"; // Importamos a Teko e a Inter
import "./globals.css";

// Configura a fonte Teko (Títulos)
const teko = Teko({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-teko",
});

// Configura a fonte Inter (Textos corridos)
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter"
});

export const metadata: Metadata = {
    title: "Palpitarena",
    description: "O jogo fica sério aqui.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
        <body className={`${teko.variable} ${inter.variable} font-sans bg-[#0f0f0f] text-white antialiased`}>
        {children}
        </body>
        </html>
    );
}