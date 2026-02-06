'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        setLoading(false)
        if (error) setMessage(error.message)
        else setMessage('Check your email for the magic link!')
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-950 px-4">
            <Card className="w-full max-w-md border-gray-800 bg-gray-900 text-gray-100">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold text-white">Level Up Chad</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="chad@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-gray-700 bg-gray-950 text-white placeholder:text-gray-500"
                                required
                            />
                        </div>
                        {message && <p className="text-sm text-green-400">{message}</p>}
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Magic Link'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-xs text-gray-500">
                        For local dev, verify email link in Supabase Inbucket (http://localhost:54324) if running locally.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
