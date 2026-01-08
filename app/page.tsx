import Link from "next/link";

export default function Home() {
  return (
      <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="z-10 text-center max-w-2xl space-y-8 animate-in fade-in zoom-in duration-1000">

          {/* Logo / Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
            Palpita Arena v2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            PALPITA<br/>ARENA
          </h1>

          <p className="text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
            A plataforma definitiva de palpites esportivos.
            <br/>
            <span className="text-sm opacity-60">Next.js 15 · Server Actions · Realtime</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              ENTRAR AGORA
            </Link>

            <button className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-lg transition-all">
              CRIAR CONTA
            </button>
          </div>

        </div>

        <footer className="absolute bottom-6 text-xs text-gray-600 uppercase tracking-widest">
          Powered by Vercel & NeonDB
        </footer>
      </main>
  );
}