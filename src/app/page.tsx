import { HeroActions } from "@/components/landing/hero-actions";

export default function Home() {
    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

            {/* 1. IMAGEM DE FUNDO (Estádio) */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{
                    backgroundImage: "url('https://wallpapers.com/images/hd/720p-sports-background-1275-x-704-x8qi0yyjkcubnw5s.jpg')",
                }}
            >
                {/* Máscara Escura (Overlay) - Para o texto aparecer bem */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-blue-900/40" />
            </div>

            {/* 2. CONTEÚDO PRINCIPAL */}
            <div className="relative z-10 text-center px-4 max-w-4xl space-y-6 animate-in fade-in zoom-in duration-700">

                {/* Badge da Temporada */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                    2ª Temporada Disponível
                </div>

                {/* Título Gigante "O JOGO FICA SÉRIO" */}
                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl leading-[0.9]">
                    O JOGO FICA <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-400">
                        SÉRIO AQUI.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-medium drop-shadow-md">
                    Escudos, artilharia, rankings e a glória de um título.
                    Palpites entre amigos com pontuação automática em tempo real.
                </p>

                {/* Botões de Ação Interativos (Substituímos os Links pelo componente) */}
                <HeroActions />

            </div>

            {/* 3. RODAPÉ */}
            <footer className="absolute bottom-0 w-full z-10 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <div className="grid grid-cols-3 max-w-5xl mx-auto py-6 text-center divide-x divide-white/10">

                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white">10+</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Ligas Oficiais</p>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-emerald-400">Ao Vivo</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Atualização Real</p>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white">H2H</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Modo Confronto</p>
                    </div>

                </div>
            </footer>

        </main>
    );
}