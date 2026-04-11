'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignupForm({ brandName }: { brandName: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If Supabase is configured to require email confirmation, signUp returns
    // a user but no session. In that case, show the "check your inbox" screen
    // instead of redirecting to a protected route the middleware will bounce.
    if (!data.session) {
      setAwaitingConfirmation(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleResend() {
    setResendStatus('sending')
    setError(null)
    const { error } = await getSupabase().auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      setResendStatus('idle')
      return
    }
    setResendStatus('sent')
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="font-serif text-2xl text-foreground">
              {brandName}
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="size-8 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 5L2 7" />
                </svg>
              </div>
            </div>
            <div className="mb-6 text-center">
              <h1 className="font-serif text-2xl">Tjek din indbakke</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Vi har sendt en bekræftelsesmail til
              </p>
              <p className="mt-1 text-sm font-medium text-foreground break-all">
                {email}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Klik på linket i mailen for at aktivere din konto og komme i gang.
              </p>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {resendStatus === 'sent' ? (
              <p className="rounded-lg bg-primary/10 p-3 text-center text-sm text-primary">
                Vi har sendt en ny bekræftelsesmail.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl py-5"
                onClick={handleResend}
                disabled={resendStatus === 'sending'}
              >
                {resendStatus === 'sending' ? 'Sender...' : 'Send mailen igen'}
              </Button>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Kan du ikke finde mailen? Tjek din spam-mappe, eller prøv at sende den igen.
            </p>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Forkert email?{' '}
              <button
                type="button"
                onClick={() => {
                  setAwaitingConfirmation(false)
                  setResendStatus('idle')
                  setError(null)
                }}
                className="font-medium text-primary hover:underline"
              >
                Tilbage
              </button>
            </p>
          </div>
        </div>
      </div>
    )
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
            <h1 className="font-serif text-2xl">Opret din konto</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {`Kom i gang med ${brandName} — det tager kun et minut`}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Navn</Label>
              <Input
                id="name"
                type="text"
                placeholder="Dit navn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl py-5"
              />
            </div>
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
                placeholder="Mindst 6 tegn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
              {loading ? 'Opretter konto...' : 'Opret konto'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Har du allerede en konto?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log ind
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
