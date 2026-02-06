/**
 * Level Up Chad - Core Game Mechanics
 * Pure functions for deterministic calculation of game state.
 */

export const CONFIG = {
    STREAK_BONUS_PER_DAY: 0.05,
    MAX_STREAK_BONUS: 2.0, // 2x multiplier
    DIMINISHING_RETURNS: [1.0, 0.6, 0.3, 0.1], // 1st, 2nd, 3rd, 4th+ times per day
    LEVEL_XP_K: 10, // Constant K for level curve
}

/**
 * Calculates XP for a specific action event.
 * @param baseXP Base XP of the action
 * @param intensity Intensity multiplier (default 1)
 * @param countToday How many times this action has been done today (including this one), 1-indexed
 * @param streakMultiplier Current user streak multiplier (e.g., 1.0 to 2.0)
 * @param isNegative If true, returns negative XP without multipliers (usually)
 */
export function calculateXP(
    baseXP: number,
    countToday: number,
    streakMultiplier: number = 1.0,
    intensity: number = 1
): number {
    if (baseXP < 0) return baseXP * intensity // Negative actions don't get buffs/nerfs usually, just raw damage

    // Diminishing returns
    const dimIndex = Math.min(countToday - 1, CONFIG.DIMINISHING_RETURNS.length - 1)
    const dimFactor = CONFIG.DIMINISHING_RETURNS[Math.max(0, dimIndex)]

    // Formula: Base * Intensity * Diminishing * Streak
    const rawXP = baseXP * intensity * dimFactor * streakMultiplier

    return Math.round(rawXP)
}

/**
 * Calculates Coins for a specific action event.
 * Coins usually don't have streak multipliers but might have diminishing returns.
 */
export function calculateCoins(
    baseCoin: number,
    countToday: number
): number {
    if (baseCoin <= 0) return 0

    // Coin diminishing returns: 100% first time, 0% after (hard cap to prevent farming) 
    // OR use similar mechanic to XP. Let's start with: 100% for first 2, then 0.
    if (countToday > 2) return 0

    return baseCoin
}

/**
 * Calculates Level and progress from Total Lifetime XP.
 * Curve: Level = floor( sqrt(max(XP, 0)) / K )
 */
export function calculateLevel(totalXP: number, k: number = CONFIG.LEVEL_XP_K) {
    const safeXP = Math.max(0, totalXP)
    const level = Math.floor(Math.sqrt(safeXP) / k)

    // XP required for NEXT level: ((Level + 1) * K)^2
    const nextLevel = level + 1
    const xpForNextLevel = Math.pow(nextLevel * k, 2)
    const xpForCurrentLevel = Math.pow(level * k, 2)

    const progress = safeXP - xpForCurrentLevel
    const totalToNext = xpForNextLevel - xpForCurrentLevel

    return {
        level,
        xpForNextLevel,
        progress,
        totalToNext,
        percent: Math.min(100, Math.floor((progress / totalToNext) * 100))
    }
}

/**
 * Calculates Streak Multiplier based on active streak days.
 * Multiplier = 1 + (streak * 0.05), capped at 2.0
 */
export function calculateMultiplier(streakDays: number): number {
    const bonus = streakDays * CONFIG.STREAK_BONUS_PER_DAY
    // Start at 1.0, add bonus, cap at MAX
    return Math.min(CONFIG.MAX_STREAK_BONUS, 1.0 + bonus)
}

/**
 * Determines current streak from a list of days where valid actions occurred.
 * @param activityDays Array of ISO date strings (YYYY-MM-DD) or Date objects, sorted DESC preferred but will sort internally.
 * @param today ISO date string for "today".
 * @param threshold Items per day required to keep streak (default 1).
 */
export function calculateStreak(
    dailyCounts: { date: string; count: number }[],
    today: string,
    threshold: number = 1
): number {
    // Simplify: Assuming dailyCounts contains entries only for days with >= threshold actions
    // Steps:
    // 1. Check if 'today' or 'yesterday' exists in strict sequence.

    // Sort desc
    const sorted = [...dailyCounts]
        .filter(d => d.count >= threshold)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (sorted.length === 0) return 0

    // Check if streak is active (has entry for today OR yesterday)
    const todayTime = new Date(today).setHours(0, 0, 0, 0)
    const yesterdayTime = new Date(todayTime - 86400000).setHours(0, 0, 0, 0)

    const latestDate = new Date(sorted[0].date).setHours(0, 0, 0, 0)

    // If last activity was before yesterday, streak is broken (0).
    if (latestDate < yesterdayTime) return 0

    // Count consecutive days going back
    let streak = 0
    let currentCheckTime = latestDate

    for (const entry of sorted) {
        const entryTime = new Date(entry.date).setHours(0, 0, 0, 0)

        // If this entry matches the expected current check time
        if (Math.abs(currentCheckTime - entryTime) < 1000) { // slight tolerance for float stuff, though integer dates are safe
            streak++
            // Move expectation to day before
            currentCheckTime -= 86400000
        } else {
            // Gap found
            break
        }
    }

    return streak
}
