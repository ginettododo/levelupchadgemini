/**
 * Effects Engine
 * Handles active buffs, debuffs, and inventory items.
 */

export const SHOP_ITEMS = [
    { key: 'streak_freeze', name: 'Streak Freeze', description: 'Protect your streak for one day of inactivity.', cost: 50, duration_hours: 24, icon: '❄️' },
    { key: 'xp_boost_2x', name: '2x XP Potion', description: 'Double XP for 2 hours.', cost: 100, duration_hours: 2, icon: '🧪' },
    { key: 'quest_reroll', name: 'Quest Reroll', description: 'Reroll one active daily quest.', cost: 20, type: 'consumable', icon: '🎲' },
]

/**
 * Checks if a specific effect is active for the user.
 * Looks at 'purchases' table for items with active_until > now.
 * For Streak Freeze, it might be a consumable that stays active until used (handled differently).
 * MVP Phase 3: Streak Freeze is active for 24h after purchase (simplified) OR acts as insurance (consumable).
 * Let's go with: Streak Freeze is a "buff" that lasts until it saves a streak? No, that requires state.
 * Simplest: Consumable. "Active Until" logic works for Potions.
 */
interface Purchase {
    item_key: string
    active_until: string | null
    [key: string]: any // For other DB fields
}

export function getActiveEffects(purchases: Purchase[]) {
    const now = new Date()
    return purchases.filter(p => p.active_until && new Date(p.active_until) > now)
}

/**
 * Calculates current XP multiplier based on active effects.
 */
export function getEffectMultiplier(activeEffects: Purchase[]): number {
    let multiplier = 1.0

    // Check for XP Boosts
    if (activeEffects.some(e => e.item_key === 'xp_boost_2x')) {
        multiplier *= 2.0
    }

    return multiplier
}

/**
 * Determines if streak is protected.
 * Logic: Did user buy a freeze that covers the missing day?
 * Complex. MVP: Infinite freeze? No.
 * MVP Implementation: When calculating streak, if today is missing, check if "Streak Freeze" was purchased "yesterday" or is "active".
 */
export function isStreakProtected(_purchases: Purchase[], _missingDate: string): boolean {
    // For MVP, return false. Implementation requires consumption logic.
    return false
}
