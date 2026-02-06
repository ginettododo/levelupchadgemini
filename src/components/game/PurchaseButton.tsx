'use client'

import { Button } from '@/components/ui/button'
import { purchaseItem } from '@/actions/purchase-item'
import { toast } from 'sonner'
import { useState, useTransition } from 'react'

export function PurchaseButton({ item, balance }: { item: any, balance: number }) {
    const [pending, startTransition] = useTransition()
    const canAfford = balance >= item.cost

    const handleBuy = () => {
        startTransition(async () => {
            const res = await purchaseItem(item.key)
            if (res.success) {
                toast.success(`Bought ${item.name}!`)
            } else {
                toast.error(res.error || 'Check funds')
            }
        })
    }

    return (
        <Button
            size="sm"
            disabled={!canAfford || pending}
            onClick={handleBuy}
            className={canAfford ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-800 text-gray-500'}
        >
            {pending ? '...' : `${item.cost} c`}
        </Button>
    )
}
