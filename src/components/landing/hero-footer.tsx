export function HeroFooter() {
    return (
        // AQUI: Adicionei 'hidden md:block'
        // Isso significa: "Escondido por padrão. Em telas médias (PC) ou maiores, mostre como bloco."
        <div className="hidden md:block w-full bg-black/40 backdrop-blur-md border-t border-white/5 py-4 relative z-20 mt-auto">
            <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">

                {/* ITEM 1: LIGAS */}
                <div className="flex flex-col items-center justify-center group cursor-default">
                    <div className="mb-1.5 p-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black font-teko text-white uppercase leading-none tracking-wide">
                        10+ <span className="text-emerald-500">LIGAS</span>
                    </h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5">
                        Mundiais
                    </p>
                </div>

                {/* ITEM 2: AO VIVO */}
                <div className="flex flex-col items-center justify-center group cursor-default">
                    <div className="mb-1.5 p-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300 relative">
                        <span className="absolute top-0 right-0 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black font-teko text-emerald-500 uppercase leading-none tracking-wide">
                        AO VIVO
                    </h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5">
                        Real Time
                    </p>
                </div>

                {/* ITEM 3: H2H */}
                <div className="flex flex-col items-center justify-center group cursor-default">
                    <div className="mb-1.5 p-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black font-teko text-white uppercase leading-none tracking-wide">
                        MODO <span className="text-emerald-500">H2H</span>
                    </h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5">
                        Duelos
                    </p>
                </div>
            </div>
        </div>
    )
}