import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function StatsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch aggregate data
    const { data: entries } = await supabase
        .from('event_log')
        .select('day_key, value, ts, actions(category)')
        .eq('user_id', user?.id)
        .gt('day_key', new Date(Date.now() - 30 * 86400 * 1000).toISOString())
        .order('day_key', { ascending: true })

    // Process data for charts
    const categoryCounts = { health: 0, mind: 0, hustle: 0 }
    const dailyActivity: Record<string, number> = {}

    entries?.forEach((e: any) => {
        // Handle Supabase join which might occur as array or object depending on types
        const actionData = Array.isArray(e.actions) ? e.actions[0] : e.actions

        if (actionData?.category) {
            const cat = actionData.category as keyof typeof categoryCounts
            if (categoryCounts[cat] !== undefined) {
                categoryCounts[cat]++
            }
        }
        // Fallback or use ts
        const day = e.day_key || (e.ts ? e.ts.split('T')[0] : '')
        if (day) {
            dailyActivity[day] = (dailyActivity[day] || 0) + 1
        }
    })

    const totalActions = (entries?.length || 0)

    return (
        <div className="space-y-6 max-w-md mx-auto pb-20 px-1">
            <header>
                <h1 className="text-xl font-bold text-gray-100">Stats</h1>
                <p className="text-sm text-gray-400">Your performance last 30 days</p>
            </header>

            <div className="grid grid-cols-3 gap-2">
                <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-gray-200">{totalActions}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Actions</div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{Object.keys(dailyActivity).length}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Active Days</div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">{(totalActions / 30).toFixed(1)}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Avg / Day</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-400">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(categoryCounts).map(([cat, count]) => (
                            <div key={cat} className="flex items-center gap-3">
                                <div className="w-16 text-xs font-bold capitalize text-gray-300">{cat}</div>
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${cat === 'health' ? 'bg-red-500' : cat === 'mind' ? 'bg-blue-500' : 'bg-amber-500'}`}
                                        style={{ width: `${(count / totalActions) * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 w-8 text-right">{count}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-400">Activity Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1 justify-center">
                    {Array.from({ length: 30 }).map((_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() - (29 - i))
                        const dayStr = d.toISOString().split('T')[0]
                        const count = dailyActivity[dayStr] || 0
                        const intensity = count === 0 ? 'bg-gray-800' : count < 3 ? 'bg-green-900' : count < 6 ? 'bg-green-700' : 'bg-green-500'

                        return (
                            <div key={i} title={`${dayStr}: ${count}`} className={`w-3 h-3 rounded-sm ${intensity}`} />
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
