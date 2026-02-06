import { Progress } from "@/components/ui/progress"
import { Trophy, Coins, Flame } from "lucide-react"

export function LevelHeader({ summary }: { summary: any }) {
    return (
        <div className="bg-gradient-to-br from-indigo-950 to-slate-950 rounded-2xl p-5 border border-indigo-900/30 shadow-xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-[-50%] left-[-20%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-indigo-500 rounded-lg shadow-lg rotate-3">
                            <span className="text-xl font-black text-white">{summary.level}</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-none mb-1">Level {summary.level}</h2>
                            <span className="text-xs text-indigo-300 font-mono">Rank: {summary.rank}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-100">{summary.walletBalance}</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-indigo-200">
                        <span>{summary.xpProgress} / {summary.xpToNext} XP</span>
                        <span>{Math.floor((summary.xpProgress / summary.xpToNext) * 100)}%</span>
                    </div>
                    <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(summary.xpProgress / summary.xpToNext) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 self-start text-xs text-orange-400 font-medium bg-orange-950/30 px-2 py-1 rounded border border-orange-900/30">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    <span>Streak: {summary.streak} Days</span>
                </div>
            </div>
        </div>
    )
}
