'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { logAction } from '@/actions/log-action'
import { toast } from 'sonner'
import { useTransition, useState } from 'react'
import { Loader2, Check, Lock } from 'lucide-react'

// Separate component for individual button to handle local optimistic state
function ActionButton({ action, countToday }: { action: any, countToday: number }) {
    const [isPending, startTransition] = useTransition()
    const [optimisticCount, setOptimisticCount] = useState(countToday)

    const isMaxed = action.max_per_day && optimisticCount >= action.max_per_day

    const handleClick = () => {
        if (isMaxed) return

        // Optimistic update
        setOptimisticCount(c => c + 1)

        // Generate client ID for dedupe
        const clientId = crypto.randomUUID()

        startTransition(async () => {
            const res = await logAction(action.key, clientId)
            if (res.success) {
                toast.success(`+${action.xp_base} XP`, { description: action.name })
            } else {
                toast.error(res.error || 'Failed to log')
                // Rollback
                setOptimisticCount(c => c - 1)
            }
        })
    }

    const baseColor =
        action.category === 'health' ? 'bg-red-950/30 border-red-900/50 hover:bg-red-900/40 text-red-100' :
            action.category === 'mind' ? 'bg-blue-950/30 border-blue-900/50 hover:bg-blue-900/40 text-blue-100' :
                'bg-amber-950/30 border-amber-900/50 hover:bg-amber-900/40 text-amber-100';

    return (
        <button
            onClick={handleClick}
            disabled={isPending || isMaxed}
            className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden h-24",
                baseColor
            )}
        >
            {isPending && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}

            <span className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{action.name}</span>
            <div className="flex items-center gap-2 text-xs opacity-70">
                <span>+{action.xp_base} XP</span>
            </div>

            {/* Cooldown/Count indicator */}
            <div className="absolute top-1 right-2 text-[10px] font-mono opacity-50">
                {optimisticCount > 0 && <span>x{optimisticCount}</span>}
            </div>

            {isMaxed && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                </div>
            )}
        </button>
    )
}

export function ActionGrid({ actions, counts }: { actions: any[], counts: Record<string, number> }) {
    const positives = actions.filter(a => !a.is_negative)

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {positives.map(action => (
                <ActionButton
                    key={action.key}
                    action={action}
                    countToday={counts[action.key] || 0}
                />
            ))}
        </div>
    )
}
