import { createClient } from '@/lib/supabase/server'
import { SHOP_ITEMS } from '@/lib/game/effects'
import { Card, CardContent } from '@/components/ui/card'
import { PurchaseButton } from '@/components/game/PurchaseButton' // New Client Component

export default async function ShopPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: wallet } = await supabase.from('wallet').select('*').eq('user_id', user?.id).single()

    return (
        <div className="space-y-6 max-w-md mx-auto pb-20 px-1">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold text-gray-100">Shop</h1>
                    <p className="text-sm text-gray-400">Spend your hard-earned coins</p>
                </div>
                <div className="bg-yellow-950/30 text-yellow-400 font-mono text-sm px-3 py-1 rounded border border-yellow-900/50">
                    {wallet?.coins_balance || 0} Coins
                </div>
            </header>

            <div className="grid grid-cols-1 gap-3">
                {SHOP_ITEMS.map(item => (
                    <Card key={item.key} className="border-gray-800 bg-gray-900">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-900/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/10">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-200">{item.name}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                            </div>
                            <PurchaseButton item={item} balance={wallet?.coins_balance || 0} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
