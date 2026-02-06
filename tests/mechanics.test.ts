import { describe, it, expect } from 'vitest'
import { calculateXP, calculateLevel, calculateMultiplier, calculateStreak, CONFIG } from '../src/lib/game/mechanics'

describe('Game Mechanics', () => {

    describe('calculateXP', () => {
        it('calculates base XP correctly', () => {
            expect(calculateXP(100, 1)).toBe(100)
        })

        it('applies diminishing returns', () => {
            // 1st: 1.0x -> 100
            expect(calculateXP(100, 1)).toBe(100)
            // 2nd: 0.6x -> 60
            expect(calculateXP(100, 2)).toBe(60)
            // 3rd: 0.3x -> 30
            expect(calculateXP(100, 3)).toBe(30)
            // 4th: 0.1x -> 10
            expect(calculateXP(100, 4)).toBe(10)
        })

        it('applies streak multiplier', () => {
            // 10 days streak -> 1.5x
            // 100 XP * 1.0 dim * 1.5 streak = 150
            expect(calculateXP(100, 1, 1.5)).toBe(150)
        })

        it('handles negative actions (no multipliers)', () => {
            expect(calculateXP(-50, 1, 2.0)).toBe(-50)
            expect(calculateXP(-50, 5, 2.0)).toBe(-50)
        })
    })

    describe('calculateLevel', () => {
        // Formula: level = floor(sqrt(xp)/10) -> xp = (level*10)^2
        // Level 0: 0-99
        // Level 1: 100-399 (10*1)^2 = 100
        // Level 2: 400-899 (10*2)^2 = 400
        // Level 10: 10000 (10*10)^2 = 10000

        it('computes level 0 for 0 XP', () => {
            const res = calculateLevel(0)
            expect(res.level).toBe(0)
            expect(res.percent).toBe(0)
        })

        it('computes level 1 for 100 XP', () => {
            const res = calculateLevel(150)
            expect(res.level).toBe(1)
            expect(res.xpForNextLevel).toBe(400) // Level 2 req
            // Progress: 150 - 100 = 50. Range 100->400 is 300. 50/300 = 16%
            expect(res.percent).toBe(16)
        })

        it('computes level 10 correctly', () => {
            expect(calculateLevel(10000).level).toBe(10)
            expect(calculateLevel(9999).level).toBe(9)
        })
    })

    describe('calculateMultiplier', () => {
        it('starts at 1.0', () => {
            expect(calculateMultiplier(0)).toBe(1.0)
        })
        it('adds 0.05 per day', () => {
            expect(calculateMultiplier(10)).toBe(1.5) // 1.0 + 0.5
        })
        it('caps at 2.0', () => {
            expect(calculateMultiplier(100)).toBe(2.0)
        })
    })

    describe('calculateStreak', () => {
        const today = '2025-01-10'

        it('returns 0 for no activity', () => {
            expect(calculateStreak([], today)).toBe(0)
        })

        it('returns 1 if active today', () => {
            const data = [{ date: '2025-01-10', count: 1 }]
            expect(calculateStreak(data, today)).toBe(1)
        })

        it('returns streak count for consecutive days ending today', () => {
            const data = [
                { date: '2025-01-10', count: 1 },
                { date: '2025-01-09', count: 1 },
                { date: '2025-01-08', count: 1 },
            ]
            expect(calculateStreak(data, today)).toBe(3)
        })

        it('returns streak count for consecutive days ending yesterday', () => {
            // Streak is safe if user hasn't logged today yet but did yesterday
            const data = [
                { date: '2025-01-09', count: 1 },
                { date: '2025-01-08', count: 1 },
            ]
            expect(calculateStreak(data, today)).toBe(2)
        })

        it('breaks streak if day skipped', () => {
            const data = [
                { date: '2025-01-10', count: 1 },
                { date: '2025-01-08', count: 1 }, // Skipped 09
            ]
            expect(calculateStreak(data, today)).toBe(1)
        })

        it('ignores days below threshold', () => {
            const data = [
                { date: '2025-01-10', count: 5 },
                { date: '2025-01-09', count: 0 }, // Below threshold 1
                { date: '2025-01-08', count: 5 },
            ]
            // Should break at 09
            expect(calculateStreak(data, today)).toBe(1)
        })
    })

})
