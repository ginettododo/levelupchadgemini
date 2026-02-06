import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ACTIONS = [
    // HEALTH (Positive)
    { key: 'gym_workout', name: 'Gym Workout', category: 'health', xp_base: 50, coin_base: 5, cooldown_hours: 4, max_per_day: 2 },
    { key: 'run_5k', name: 'Run 5km', category: 'health', xp_base: 60, coin_base: 6, cooldown_hours: 12, max_per_day: 1 },
    { key: 'pushups_20', name: '20 Pushups', category: 'health', xp_base: 10, coin_base: 1, cooldown_hours: 1, max_per_day: 5 },
    { key: 'drink_water', name: 'Drink Water (500ml)', category: 'health', xp_base: 5, coin_base: 0, cooldown_hours: 1, max_per_day: 8 },
    { key: 'cold_shower', name: 'Cold Shower', category: 'health', xp_base: 25, coin_base: 3, cooldown_hours: 6, max_per_day: 2 },
    { key: 'meditate_10m', name: 'Meditate 10m', category: 'mind', xp_base: 20, coin_base: 2, cooldown_hours: 4, max_per_day: 3 },
    { key: 'read_10p', name: 'Read 10 Pages', category: 'mind', xp_base: 15, coin_base: 2, cooldown_hours: 1, max_per_day: 10 },
    { key: 'learn_code', name: 'Code Session (1h)', category: 'hustle', xp_base: 40, coin_base: 5, cooldown_hours: 2, max_per_day: 4 },
    { key: 'deep_work', name: 'Deep Work (1h)', category: 'hustle', xp_base: 50, coin_base: 5, cooldown_hours: 2, max_per_day: 4 },
    { key: 'journal', name: 'Journaling', category: 'mind', xp_base: 15, coin_base: 1, cooldown_hours: 12, max_per_day: 1 },

    // NEGATIVE (Bad Habits)
    { key: 'smoke', name: 'Smoke Cigarette', category: 'health', xp_base: -20, coin_base: 0, is_negative: true },
    { key: 'alcohol', name: 'Drink Alcohol', category: 'health', xp_base: -30, coin_base: 0, is_negative: true },
    { key: 'junk_food', name: 'Eat Junk Food', category: 'health', xp_base: -25, coin_base: 0, is_negative: true },
    { key: 'doomscroll', name: 'Doomscroll (>30m)', category: 'mind', xp_base: -15, coin_base: 0, is_negative: true },
    { key: 'skip_workout', name: 'Skip Planned Workout', category: 'health', xp_base: -40, coin_base: 0, is_negative: true },
    { key: 'procrastinate', name: 'Procrastinate', category: 'hustle', xp_base: -20, coin_base: 0, is_negative: true },
    { key: 'stay_up_late', name: 'Stay Up Late (>1am)', category: 'health', xp_base: -30, coin_base: 0, is_negative: true },
]

async function seed() {
    console.log('Seeding actions...')

    for (const action of ACTIONS) {
        const { error } = await supabase
            .from('actions')
            .upsert(action, { onConflict: 'key' })

        if (error) {
            console.error(`Error upserting ${action.key}:`, error.message)
        } else {
            console.log(`Upserted: ${action.name}`)
        }
    }

    console.log('Done!')
}

seed()
