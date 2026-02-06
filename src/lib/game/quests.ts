import { SupabaseClient } from '@supabase/supabase-js'

export type QuestRule = {
    actionKey?: string
    category?: 'health' | 'mind' | 'hustle'
    count?: number
    minValue?: number // Minimum intensity/value per action
    minXP?: number // Alternative: Earn X XP in category
}

export type QuestDefinition = {
    type: 'daily' | 'weekly' | 'boss'
    title: string
    reward_xp: number
    reward_coin: number
    rules: QuestRule
}

const DAILY_TEMPLATES: QuestDefinition[] = [
    { type: 'daily', title: 'Hit the Gym', reward_xp: 100, reward_coin: 10, rules: { actionKey: 'gym_workout', count: 1 } },
    { type: 'daily', title: 'Stay Hydrated', reward_xp: 20, reward_coin: 2, rules: { actionKey: 'drink_water', count: 3 } },
    { type: 'daily', title: 'Read a bit', reward_xp: 30, reward_coin: 5, rules: { actionKey: 'read_10p', count: 1 } },
    { type: 'daily', title: 'Meditate', reward_xp: 30, reward_coin: 5, rules: { actionKey: 'meditate_10m', count: 1 } },
    { type: 'daily', title: 'Pushup Master', reward_xp: 40, reward_coin: 5, rules: { actionKey: 'pushups_20', count: 2 } },
    { type: 'daily', title: 'Focus Time', reward_xp: 60, reward_coin: 10, rules: { actionKey: 'deep_work', count: 1 } },
]

const WEEKLY_TEMPLATES: QuestDefinition[] = [
    { type: 'weekly', title: 'Weekly Warrior (Gym)', reward_xp: 300, reward_coin: 50, rules: { actionKey: 'gym_workout', count: 3 } },
    { type: 'weekly', title: 'Bookworm', reward_xp: 200, reward_coin: 30, rules: { actionKey: 'read_10p', count: 5 } },
    { type: 'weekly', title: 'Zen Master', reward_xp: 200, reward_coin: 30, rules: { actionKey: 'meditate_10m', count: 5 } },
]

/**
 * Checks for active quests for the user. If missing for current period, generates them.
 */
export async function ensureQuests(supabase: SupabaseClient, userId: string) {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

    // Check Daily Quests
    const { data: dailies } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'daily')
        .gte('created_at', startOfDay) // Assuming created_at is good proxy for "for today"

    if (!dailies || dailies.length === 0) {
        await generateDailyQuests(supabase, userId)
    }

    // Check Weekly Quests (Simple logic: check if any active weekly exists)
    // Better logic: store "week_start" date in quest or check created_at > last Monday
    // For MVP phase 3: strict check on expiration or status
    const { data: weeklies } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'weekly')
        .eq('status', 'active')

    if (!weeklies || weeklies.length === 0) {
        await generateWeeklyQuests(supabase, userId)
    }
}

async function generateDailyQuests(supabase: SupabaseClient, userId: string) {
    // Pick 3 random quests
    // Improvement: Pick based on deficits (least used category) -> Phase 4
    const shuffled = [...DAILY_TEMPLATES].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 3)

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const questsToInsert = selected.map(q => ({
        user_id: userId,
        type: 'daily',
        title: q.title,
        rules: q.rules,
        reward_xp: q.reward_xp,
        reward_coin: q.reward_coin,
        start_date: todayStr,
        end_date: todayStr, // Expires end of today (conceptually), logic uses created_at usually
        status: 'active'
    }))

    await supabase.from('quests').insert(questsToInsert)
}

async function generateWeeklyQuests(supabase: SupabaseClient, userId: string) {
    const shuffled = [...WEEKLY_TEMPLATES].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 1) // Just 1 for now

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const nextWeek = new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0]

    const questsToInsert = selected.map(q => ({
        user_id: userId,
        type: 'weekly',
        title: q.title,
        rules: q.rules,
        reward_xp: q.reward_xp,
        reward_coin: q.reward_coin,
        start_date: todayStr,
        end_date: nextWeek,
        status: 'active'
    }))

    await supabase.from('quests').insert(questsToInsert)
}

/**
 * Evaluates quest progress based on event history.
 * Returns progress percentage (0-100) and current count.
 */
// Basic Event Type for engine
type GameEvent = {
    actions: {
        key: string
        category: string
    }
    [key: string]: any
}

export function evaluateQuestProgress(quest: { rules: any }, events: GameEvent[]): { progress: number, current: number, target: number } {
    const rules = quest.rules as QuestRule
    if (!rules) return { progress: 0, current: 0, target: 1 }

    let count = 0
    const target = rules.count || 1

    // Filter events valid for this quest (date range check should be done by caller or here)
    // Assuming events passed are already potentially valid (e.g. from Today for daily quests)

    if (rules.actionKey) {
        count = events.filter((e) => e.actions?.key === rules.actionKey).length
    } else if (rules.category) {
        count = events.filter((e) => e.actions?.category === rules.category).length
    }

    return {
        progress: Math.min(100, Math.floor((count / target) * 100)),
        current: count,
        target
    }
}
