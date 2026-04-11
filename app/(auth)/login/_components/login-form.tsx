'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function safeRedirect(url: string | null): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return '/dashboard'
  return url
}

export function LoginForm({ brandName }: { brandName: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirectTo'))
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await getSupabase().auth.signInWithPassword({ email, password })

    if (error) {
      setError('Forkert email eller adgangskode')
      setLoading(false)
      return
    }

    // Force a hard navigation so the server picks up the new auth cookie
    const explicitRedirect = searchParams.get('redirectTo')
    if (!explicitRedirect) {
      try {
        const res = await fetch('/api/auth/role')
        if (res.ok) {
          const { role } = await res.json()
          if (role === 'ADMIN') {
            window.location.href = '/admin'
            return
          }
        }
      } catch {
        // Fall through to default redirect
      }
    }

    window.location.href = redirectTo
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-serif text-2xl text-foreground">
            {brandName}
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl">Velkommen tilbage</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {`Log ind på din ${brandName} konto`}
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl py-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Adgangskode</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl py-5"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full rounded-xl py-5 text-base"
              disabled={loading}
            >
              {loading ? 'Logger ind...' : 'Log ind'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Har du ikke en konto?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Opret konto
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
