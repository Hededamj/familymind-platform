'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function Topbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  // Don't show topbar on admin (has sidebar), dashboard (has own header), or onboarding
  if (pathname?.startsWith('/admin')) return null
  if (pathname?.startsWith('/dashboard')) return null
  if (pathname?.startsWith('/onboarding')) return null

  const isAuth = pathname === '/login' || pathname === '/signup'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-normal text-foreground">
            FamilyMind
          </span>
        </Link>

        {/* Navigation */}
        {!isAuth && (
          <nav className="hidden items-center gap-8 sm:flex">
            <Link
              href="/browse"
              className={`text-sm transition-colors hover:text-primary ${
                pathname === '/browse'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Opdag
            </Link>
            <Link
              href="/subscribe"
              className={`text-sm transition-colors hover:text-primary ${
                pathname === '/subscribe'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Abonnement
            </Link>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuth ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Tilbage</Link>
            </Button>
          ) : isLoggedIn ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Min side</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 size-3.5" />
                Log ud
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log ind</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl">
                <Link href="/signup">Kom i gang</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
