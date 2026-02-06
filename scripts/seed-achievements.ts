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

const ACHIEVEMENTS = [
    { key: 'first_step', name: 'First Step', description: 'Log your first action.', icon: '👣', reward_xp: 50, reward_coin: 10, rules: { type: 'count', target: 1 } },
    { key: 'consistent_3', name: 'Consistent', description: 'Maintain a 3-day streak.', icon: '🔥', reward_xp: 100, reward_coin: 20, rules: { type: 'streak', target: 3 } },
    { key: 'disciplined_7', name: 'Disciplined', description: 'Maintain a 7-day streak.', icon: '🛡️', reward_xp: 500, reward_coin: 100, rules: { type: 'streak', target: 7 } },
    { key: 'hustler_level_1', name: 'Starting Hustle', description: 'Reach Level 5.', icon: '💼', reward_xp: 200, reward_coin: 40, rules: { type: 'level', target: 5 } },
]

async function seed() {
    console.log('Seeding achievements...')

    for (const ach of ACHIEVEMENTS) {
        const { error } = await supabase
            .from('achievements')
            .upsert(ach, { onConflict: 'key' })

        if (error) {
            console.error(`Error upserting ${ach.key}:`, error.message)
        } else {
            console.log(`Upserted: ${ach.name}`)
        }
    }

    console.log('Done!')
}

seed()
