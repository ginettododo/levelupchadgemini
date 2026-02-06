import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
            <main className="mx-auto max-w-md px-4 py-6">
                {children}
            </main>
            <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900 p-4 text-center">
                <div className="flex justify-around text-xs text-gray-400">
                    <a href="/today" className="p-2 hover:text-white">Today</a>
                    <a href="/quests" className="p-2 hover:text-white">Quests</a>
                    <a href="/shop" className="p-2 hover:text-white">Shop</a>
                    <a href="/stats" className="p-2 hover:text-white">Stats</a>
                </div>
            </nav>
        </div>
    )
}
