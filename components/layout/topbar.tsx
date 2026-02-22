'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, User, Compass, CreditCard } from 'lucide-react'

const publicNav = [
  { href: '/browse', label: 'Opdag', icon: Compass },
  { href: '/subscribe', label: 'Abonnement', icon: CreditCard },
]

const authNav = [
  { href: '/dashboard', label: 'Min side', icon: User },
  { href: '/browse', label: 'Opdag', icon: Compass },
]

export function Topbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Don't show topbar on admin (has sidebar), dashboard (has own header), or onboarding
  if (pathname?.startsWith('/admin')) return null
  if (pathname?.startsWith('/dashboard')) return null
  if (pathname?.startsWith('/onboarding')) return null

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const nav = isLoggedIn ? authNav : publicNav

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    window.location.href = '/'
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-tight text-foreground">
              FamilyMind
            </span>
          </Link>

          {/* Desktop navigation */}
          {!isAuthPage && (
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-sand ${
                    pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 sm:flex">
            {isAuthPage ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/">Tilbage</Link>
              </Button>
            ) : isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground"
              >
                <LogOut className="mr-1.5 size-3.5" />
                Log ud
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log ind</Link>
                </Button>
                <Button asChild size="sm" className="rounded-xl">
                  <Link href="/signup">Kom i gang</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          {!isAuthPage && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-sand sm:hidden"
              aria-label={mobileOpen ? 'Luk menu' : 'Åbn menu'}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}

          {/* Mobile: auth page back button */}
          {isAuthPage && (
            <Button asChild variant="ghost" size="sm" className="sm:hidden">
              <Link href="/">Tilbage</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-white sm:hidden">
          <nav className="flex flex-col p-4">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-sand text-foreground'
                      : 'text-muted-foreground hover:bg-sand'
                  }`}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}

            <div className="my-3 border-t border-border" />

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-sand"
              >
                <LogOut className="size-5" />
                Log ud
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-xl border border-border px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-sand"
                >
                  Log ind
                </Link>
                <Link
                  href="/signup"
                  className="mt-2 flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Kom i gang
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
