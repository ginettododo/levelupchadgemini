import Link from "next/link";
import { MoveRight, Trophy, Zap, Shield, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, straight to the grind
  if (user) {
    redirect("/today");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">Level UP Chad</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
        >
          Login
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Trophy className="w-3 h-3" /> Phase 3 Deployment Active
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter italic uppercase mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-[0.9]">
            Stop Being <br /> A Casual.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Gamify your discipline. Track your habits, earn XP, unlock achievements, and climb the ranks from Novice to <span className="text-white font-bold italic underline decoration-indigo-500 decoration-2 underline-offset-4">Giga Chad</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="group relative px-8 py-4 bg-white text-black font-black uppercase italic tracking-wider rounded-xl hover:scale-105 transition-all flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Journey <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left animate-in fade-in duration-1000 delay-500 fill-mode-both">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors group">
            <Shield className="w-8 h-8 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">Anti-Copium System</h3>
            <p className="text-sm text-gray-500">Real-time habit tracking with diminishing returns to prevent fake productivity farming.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors group">
            <Target className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">Dynamic Quests</h3>
            <p className="text-sm text-gray-500">Daily and weekly challenges that force you to push beyond your current comfort zone.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors group">
            <Trophy className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">Ranked Progression</h3>
            <p className="text-sm text-gray-500">Visual level-ups and achievement badges that reflect your actual real-world progress.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-12 text-center text-gray-600 text-[10px] uppercase tracking-[0.2em] font-bold">
        Level UP Chad © 2026 • Disciplina Est Libertas
      </footer>
    </div>
  );
}

