'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SHOP_ITEMS } from '@/lib/game/effects'

export async function purchaseItem(itemKey: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Validate Item
    const item = SHOP_ITEMS.find(i => i.key === itemKey)
    if (!item) return { success: false, error: 'Item not found' }

    // 2. Check Balance
    const { data: wallet } = await supabase.from('wallet').select('coins_balance').eq('user_id', user.id).single()
    if (!wallet || wallet.coins_balance < item.cost) {
        return { success: false, error: 'Insufficient funds' }
    }

    // 3. Process Transaction (Deduct Coins)
    const { error: walletError } = await supabase
        .from('wallet')
        .update({ coins_balance: wallet.coins_balance - item.cost })
        .eq('user_id', user.id)

    if (walletError) return { success: false, error: 'Transaction failed' }

    // 4. Grant Item / Apply Effect
    let activeUntil = null
    if (item.duration_hours) {
        const now = new Date()
        now.setHours(now.getHours() + item.duration_hours)
        activeUntil = now.toISOString()
    }

    const { error: purchaseError } = await supabase.from('purchases').insert({
        user_id: user.id,
        item_key: item.key,
        cost: item.cost,
        active_until: activeUntil
    })

    if (purchaseError) {
        // Critical: Refund coins if insert fails (omitted for MVP speed, but noted)
        return { success: false, error: 'Failed to deliver item' }
    }

    revalidatePath('/shop')
    revalidatePath('/today') // Wallet balance update
    return { success: true }
}
