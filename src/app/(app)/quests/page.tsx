import { createClient } from '@/lib/supabase/server'
import { ensureQuests, evaluateQuestProgress } from '@/lib/game/quests'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function QuestsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Lazy generate quests if needed
    await ensureQuests(supabase, user.id)

    // 2. Fetch Quests
    const { data: quests } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'done'])
        .order('created_at', { ascending: false })

    // 3. Fetch Events (Today) to calc progress for Dailies
    // For Weeklies, we'd need more history. Simplified for MVP: Dailies only rely on Today's events.
    const today = new Date().toISOString().split('T')[0]
    const { data: events } = await supabase
        .from('event_log')
        .select('*, actions(key, category)')
        .eq('user_id', user.id)
        .gte('day_key', today)

    const activeQuests = quests?.filter(q => q.status !== 'expired') || []

    return (
        <div className="space-y-6 max-w-md mx-auto pb-20 px-1">
            <header>
                <h1 className="text-xl font-bold text-gray-100">Quests</h1>
                <p className="text-sm text-gray-400">Complete tasks for extra rewards</p>
            </header>

            <div className="space-y-3">
                {activeQuests.map(quest => {
                    const { progress, current, target } = evaluateQuestProgress(quest, events || [])
                    const isDone = progress >= 100 || quest.status === 'done'

                    return (
                        <Card key={quest.id} className={`border-gray-800 bg-gray-900 ${isDone ? 'opacity-70' : ''}`}>
                            <CardContent className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {quest.type === 'daily' && <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded uppercase font-bold">Daily</span>}
                                            {quest.type === 'weekly' && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded uppercase font-bold">Weekly</span>}
                                            <h3 className={`font-semibold text-gray-200 ${isDone ? 'line-through' : ''}`}>{quest.title}</h3>
                                        </div>
                                        <p className="text-xs text-gray-400">Reward: <span className="text-yellow-400">{quest.reward_coin} Coins</span> • <span className="text-indigo-400">{quest.reward_xp} XP</span></p>
                                    </div>
                                    {isDone ? <CheckCircle2 className="text-green-500 w-6 h-6" /> : <Circle className="text-gray-700 w-6 h-6" />}
                                </div>

                                {!isDone && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Progress</span>
                                            <span>{current} / {target}</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                )}
                                {/* Claim Button could go here if manual claim is required */}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
