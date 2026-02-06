'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateStreak, calculateXP, calculateCoins } from '@/lib/game/mechanics'

export async function logAction(actionKey: string, clientId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // 1. Fetch Action Definition
    const { data: action } = await supabase
        .from('actions')
        .select('*')
        .eq('key', actionKey)
        .single()

    if (!action) {
        return { success: false, error: 'Action not found' }
    }

    // 2. Constraints Check
    // We need to know how many times performed today and LAST time performed
    const today = new Date().toISOString().split('T')[0]

    const { data: recentLogs } = await supabase
        .from('event_log')
        .select('ts')
        .eq('user_id', user.id)
        .eq('action_id', action.id)
        .order('ts', { ascending: false })
        .limit(action.max_per_day ? action.max_per_day + 1 : 10)

    // Filter for today
    const todayLogs = recentLogs?.filter(l => l.ts.startsWith(today)) || []

    // Check Max Per Day
    if (action.max_per_day && todayLogs.length >= action.max_per_day) {
        return { success: false, error: `Daily limit reached for ${action.name}` }
    }

    // Check Cooldown
    if (action.cooldown_hours && recentLogs && recentLogs.length > 0) {
        const lastLog = new Date(recentLogs[0].ts).getTime()
        const now = Date.now()
        const diffHours = (now - lastLog) / (1000 * 60 * 60)

        if (diffHours < action.cooldown_hours) {
            const remaining = Math.ceil((action.cooldown_hours - diffHours) * 60)
            return { success: false, error: `Cooldown active. Wait ${remaining} mins.` }
        }
    }

    // 3. Calculate XP & Coins (The Engine)
    const countToday = todayLogs.length + 1 // 1-indexed count including this one

    // Fetch history for streak (simplified for MVP Phase 2: verify last 30 days)
    const { data: streakEvents } = await supabase
        .from('event_log')
        .select('day_key, value')
        .eq('user_id', user.id)
        .gt('day_key', new Date(Date.now() - 30 * 86400 * 1000).toISOString())

    const dailyCounts: Record<string, number> = {}
    streakEvents?.forEach(e => {
        dailyCounts[e.day_key] = (dailyCounts[e.day_key] || 0) + 1
    })
    // Ensure we count today if not present (although we haven't inserted yet, 
    // calculateStreak handles "today or yesterday" logic).
    dailyCounts[today] = (dailyCounts[today] || 0)

    const streak = calculateStreak(
        Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
        today,
        1
    )

    const multiplier = 1.0 + (streak * 0.05)

    const finalXP = calculateXP(action.xp_base, countToday, multiplier)
    const finalCoin = calculateCoins(action.coin_base, countToday)

    // 4. Insert Log
    const { error } = await supabase
        .from('event_log')
        .insert({
            user_id: user.id,
            action_id: action.id,
            day_key: today,
            value: 1, // Default intensity
            client_id: clientId, // Deduplication key
            final_xp: finalXP,
            final_coin: finalCoin
        })

    if (error) {
        // Handle Unique Violation (dedupe) gracefully
        if (error.code === '23505') { // Postgres unique_violation
            return { success: true, duplicate: true }
        }
        return { success: false, error: error.message }
    }

    // 4. Update Aggregates (Profile Total XP) - OPTIONAL but recommended for performance
    // We can trigger a re-calc or rely on the SQL trigger I should create.
    // For now, let's assume we rely on raw event aggregation on read (for MVP Phase 2) 
    // or we add the RPC call to queries.ts to sum it up.

    revalidatePath('/today')

    // 5. Background Checks (Quests & Achievements)
    // We fetch events again with join for evaluateQuestProgress
    const { data: todayEvents } = await supabase
        .from('event_log')
        .select('*, actions(key, category)')
        .eq('user_id', user.id)
        .eq('day_key', today)

    if (todayEvents) {
        const { checkQuestCompletion } = await import('@/lib/game/quests')
        const { checkAchievements, ACHIEVEMENTS } = await import('@/lib/game/achievements')
        const { calculateLevel } = await import('@/lib/game/mechanics')

        await checkQuestCompletion(supabase, user.id, todayEvents)

        // For achievements, we need current stats
        const { data: stats } = await supabase.rpc('get_user_stats', { target_user_id: user.id })
        const totalXP = stats?.total_xp || 0
        const levelData = calculateLevel(totalXP)

        await checkAchievements(supabase, user.id, {
            totalActions: stats?.total_actions || 0,
            streak,
            level: levelData.level
        })
    }

    return { success: true }
}
