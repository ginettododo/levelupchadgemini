import { createClient } from '@/lib/supabase/server'
import { getDaySummary } from '@/lib/game/queries'
import { LevelHeader } from '@/components/game/LevelHeader'
import { ActionGrid } from '@/components/game/ActionGrid'
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch all state in one go
    const summary = await getDaySummary(supabase, user.id)

    // Need actions definition to render grid
    const { data: actions } = await supabase.from('actions').select('*').order('name')

    return (
        <div className="space-y-6 max-w-md mx-auto pb-10">
            <header className="px-1">
                <h1 className="text-xl font-bold text-gray-100">Today</h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </header>

            <LevelHeader summary={summary} />

            <section>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-semibold text-gray-200">Quick Log</h3>
                </div>
                <ActionGrid actions={actions || []} counts={summary.actionsToday} />
            </section>

            {/* Negative Actions (Collapsible placeholder for now) */}
            <section className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3 px-1 opacity-60">
                    <h3 className="text-sm font-semibold text-red-300">Negative Habits</h3>
                </div>
                <p className="text-xs text-center text-gray-600">Coming Phase 3</p>
            </section>

            <Toaster />
        </div>
    )
}
