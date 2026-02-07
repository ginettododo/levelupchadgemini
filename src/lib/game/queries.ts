import { SupabaseClient } from '@supabase/supabase-js'
import { calculateXP, calculateCoins, calculateStreak, calculateLevel } from './mechanics'

export type DaySummary = {
    xpToday: number
    coinsToday: number
    streak: number
    level: number
    xpProgress: number
    xpToNext: number
    walletBalance: number
    rank: string
    actionsToday: Record<string, number> // actionKey -> count
    history: any[]
}

/**
 * Fetches the user's dashboard state:
 * - Profile (level params)
 * - Events from today (to count usage)
 * - Events from recent history (to calc streak)
 * - Wallet balance
 */
export async function getDaySummary(
    supabase: SupabaseClient,
    userId: string,
    timezone: string = 'UTC'
): Promise<DaySummary> {
    const today = new Date().toISOString().split('T')[0] // simplified for MVP, ideally use TZ

    // 1. Fetch Profile & Wallet
    // 2. Fetch Actions Catalog (cached usually, but fetch here for now)
    // 3. Fetch Events (Today AND last 30 days for streak)

    const [profileRes, walletRes, eventsRes, actionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallet').select('*').eq('user_id', userId).single(),
        supabase.from('event_log')
            .select('*, actions(key, xp_base, coin_base)')
            .eq('user_id', userId)
            .order('ts', { ascending: false })
            .limit(1000), // reasonably enough for 30d history of a normal user
        supabase.from('actions').select('*')
    ])

    const profile = profileRes.data
    const wallet = walletRes.data
    const events = eventsRes.data || []
    const actions = actionsRes.data || []

    // --- 1. Calculate Streak ---
    // Group events by day
    const dailyCounts: Record<string, number> = {}
    events.forEach((e: { day_key?: string, ts: string }) => {
        // e.day_key should be trusted if reliable, otherwise derive from e.ts
        const day = e.day_key || e.ts.split('T')[0]
        dailyCounts[day] = (dailyCounts[day] || 0) + 1
    })

    const streak = calculateStreak(
        Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
        today,
        profile?.streak_threshold || 1
    )

    // --- 2. Calculate Today's Stats ---
    // Re-run the deterministic engine on today's events to get precise XP/Coin sums 
    // (OR rely on DB/Application state if we stored running totals. We are doing Event Sourcing Lite, so re-calc is safer)

    const todayEvents = events.filter((e: any) => {
        const day = e.day_key || e.ts.split('T')[0]
        return day === today
    })

    // We need to process today's events IN ORDER to apply diminishing returns correctly
    const todayEventsSorted = [...todayEvents].sort((a: any, b: any) => new Date(a.ts).getTime() - new Date(b.ts).getTime())

    let xpToday = 0
    let coinsToday = 0
    const actionsToday: Record<string, number> = {}

    // Multiplier based on streak (applied to today)
    // NOTE: If today's action KEEPS the streak, does it apply immediately?
    // Usually yes. If streak was 5 yesterday, today is 6th day. 
    // Mechanics.calculateStreak returns current streak INCLUDING today if valid.
    // We prefer "Streak going into today" for the bonus, or "Current streak". 
    // Let's use `calculateMultiplier(streak)` where streak includes today if we've done stuff.
    // Actually, standard game design: Streak Bonus applies based on "Streak Level". 
    // If I have 5 day streak, I get 1.25x today.
    const multiplier = 1.0 + (streak * 0.05) // Simplified calc re-used logic

    for (const event of todayEventsSorted) {
        const actionKey = event.actions?.key
        if (!actionKey) continue

        actionsToday[actionKey] = (actionsToday[actionKey] || 0) + 1

        // Re-calc specific event yield
        // Note: We are recalculating what happened. 
        // Ideally event_log should store the `actual_xp_gained` snapshot to avoid changing history if rules change.
        // BUT for Phase 2 MVP, we re-calc.
        const actionDef = actions.find((a: any) => a.key === actionKey)
        if (actionDef) {
            const xp = calculateXP(actionDef.xp_base, actionsToday[actionKey], multiplier)
            const coins = calculateCoins(actionDef.coin_base, actionsToday[actionKey])
            xpToday += xp
            coinsToday += coins
        }
    }

    // --- 3. Lifetime Stats (Level) ---
    // For precise level, we need SUM of all lifetime XP.
    // Querying 1000 events might miss old history.
    // Optimization: `profiles` should probably store `total_xp` updated via triggers or server actions.
    // For MVP: We will use a SQL query to get the SUM of everything, OR just fetch all (lightweight for <5k events).
    // Let's add a `getLifetimeXp` RPC call or just sum in SQL. 
    // For now, let's assume `profiles` has `temp_xp` or we just sum the last 1000 and "assume" partial history? No, that breaks leveling.
    // FIX: Let's create a SQL function `get_user_stats(uid)` that sums it up fast.

    const { data: stats } = await supabase.rpc('get_user_stats', { target_user_id: userId })
    // Fallback if RPC not made yet
    const totalXP = stats?.total_xp || 0
    const levelStats = calculateLevel(totalXP, profile?.level_scale || 10)

    // Determine Rank
    let rank = 'Novice'
    if (levelStats.level >= 50) rank = 'Giga Chad'
    else if (levelStats.level >= 30) rank = 'Elite'
    else if (levelStats.level >= 20) rank = 'Disciplined'
    else if (levelStats.level >= 10) rank = 'Grinder'

    return {
        xpToday,
        coinsToday,
        streak,
        level: levelStats.level,
        xpProgress: levelStats.progress,
        xpToNext: levelStats.totalToNext,
        walletBalance: wallet?.coins_balance || 0,
        rank,
        actionsToday,
        history: events
    }
}
