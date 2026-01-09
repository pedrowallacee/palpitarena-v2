import { HeroActions } from "@/components/landing/hero-actions";
import { Navbar } from "@/components/landing/navbar";

export default function Home() {
    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0f0f0f]">

            <Navbar />

            {/* 1. IMAGEM DE FUNDO */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{
                    backgroundImage: "url('https://wallpapers.com/images/hd/720p-sports-background-1275-x-704-x8qi0yyjkcubnw5s.jpg')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-blue-900/40" />
            </div>

            {/* 2. CONTEÚDO PRINCIPAL (Ajustado para Mobile) */}
            <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[80vh] pt-20">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a3e635]/10 border border-[#a3e635]/20 text-[#a3e635] text-[10px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#a3e635] rounded-full animate-pulse"/>
                    2ª Temporada Disponível
                </div>

                {/* Título Responsivo */}
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter text-white drop-shadow-2xl leading-[0.85] font-teko mb-6">
                    O JOGO FICA <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">
                        SÉRIO AQUI.
                    </span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-xl mx-auto font-medium drop-shadow-md px-4 leading-relaxed mb-8">
                    Escudos, artilharia, rankings e a glória de um título.
                    Palpites entre amigos com pontuação automática em tempo real.
                </p>

                {/* Botões de Ação */}
                <div className="w-full max-w-md mx-auto">
                    <HeroActions />
                </div>

            </div>

            {/* 3. RODAPÉ (Esconde no mobile muito pequeno para não poluir) */}
            <footer className="absolute bottom-0 w-full z-10 border-t border-white/10 bg-black/40 backdrop-blur-md hidden sm:block">
                <div className="grid grid-cols-3 max-w-5xl mx-auto py-6 text-center divide-x divide-white/10">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white font-teko">10+</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Ligas Oficiais</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-[#a3e635] font-teko">Ao Vivo</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Atualização Real</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white font-teko">H2H</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Modo Confronto</p>
                    </div>
                </div>
            </footer>

        </main>
    );
}