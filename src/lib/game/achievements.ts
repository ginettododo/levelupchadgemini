import { SupabaseClient } from '@supabase/supabase-js'

export type AchievementDefinition = {
    key: string
    name: string
    description: string
    rules: {
        type: 'count' | 'streak' | 'level'
        target: number
        actionKey?: string
        category?: string
    }
    reward_xp: number
    reward_coin: number
    icon: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    { key: 'first_step', name: 'First Step', description: 'Log your first action.', icon: '👣', reward_xp: 50, reward_coin: 10, rules: { type: 'count', target: 1 } },
    { key: 'consistent_3', name: 'Consistent', description: 'Maintain a 3-day streak.', icon: '🔥', reward_xp: 100, reward_coin: 20, rules: { type: 'streak', target: 3 } },
    { key: 'disciplined_7', name: 'Disciplined', description: 'Maintain a 7-day streak.', icon: '🛡️', reward_xp: 500, reward_coin: 100, rules: { type: 'streak', target: 7 } },
    { key: 'hustler_level_1', name: 'Starting Hustle', description: 'Reach Level 5.', icon: '💼', reward_xp: 200, reward_coin: 40, rules: { type: 'level', target: 5 } },
]

export async function checkAchievements(supabase: SupabaseClient, userId: string, stats: any) {
    // 1. Fetch unlocked achievements
    const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('achievement_key')
        .eq('user_id', userId)

    const unlockedKeys = new Set(unlocked?.map(u => u.achievement_key) || [])

    for (const ach of ACHIEVEMENTS) {
        if (unlockedKeys.has(ach.key)) continue

        let isMet = false
        if (ach.rules.type === 'count') {
            if (stats.totalActions >= ach.rules.target) isMet = true
        } else if (ach.rules.type === 'streak') {
            if (stats.streak >= ach.rules.target) isMet = true
        } else if (ach.rules.type === 'level') {
            if (stats.level >= ach.rules.target) isMet = true
        }

        if (isMet) {
            // Unlock!
            await supabase.from('user_achievements').insert({
                user_id: userId,
                achievement_key: ach.key
            })

            // Rewards are handled by DB trigger on user_achievements insert 
            // (I'll add that to Migration 0002)
        }
    }
}
