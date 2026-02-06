import { describe, it, expect } from 'vitest'
import { evaluateQuestProgress } from '../src/lib/game/quests'

describe('Quest Logic', () => {
    describe('evaluateQuestProgress', () => {
        it('calculates progress by actionKey', () => {
            const quest = { rules: { actionKey: 'test_action', count: 5 } }
            const events = [
                { actions: { key: 'test_action', category: '' } },
                { actions: { key: 'test_action', category: '' } },
                { actions: { key: 'other_action', category: '' } },
            ]
            const res = evaluateQuestProgress(quest, events)
            expect(res.current).toBe(2)
            expect(res.target).toBe(5)
            expect(res.progress).toBe(40)
        })

        it('calculates progress by category', () => {
            const quest = { rules: { category: 'health', count: 3 } }
            const events = [
                { actions: { key: 'gym', category: 'health' } },
                { actions: { key: 'run', category: 'health' } },
                { actions: { key: 'read', category: 'mind' } },
            ]
            const res = evaluateQuestProgress(quest, events)
            expect(res.current).toBe(2)
            expect(res.progress).toBe(66) // Math.floor(2/3*100)
        })

        it('handles empty events', () => {
            const quest = { rules: { actionKey: 'test', count: 1 } }
            const res = evaluateQuestProgress(quest, [])
            expect(res.current).toBe(0)
            expect(res.progress).toBe(0)
        })
    })
})
