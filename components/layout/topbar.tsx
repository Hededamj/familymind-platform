'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, LogOut, User, Compass, CreditCard } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const publicNav = [
  { href: '/browse', label: 'Opdag', icon: Compass },
  { href: '/subscribe', label: 'Abonnement', icon: CreditCard },
]

const authNav = [
  { href: '/dashboard', label: 'Min side', icon: User },
  { href: '/browse', label: 'Opdag', icon: Compass },
]

type Props = {
  brandName: string
  logoUrl: string | null
}

export function Topbar({ brandName, logoUrl }: Props) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  // Close mobile menu on route change — adjust state during render
  const [prevPath, setPrevPath] = useState(pathname)
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    setMobileOpen(false)
  }

  // Don't show topbar on routes that use AppLayout (has its own shell)
  if (pathname?.startsWith('/admin')) return null
  if (pathname?.startsWith('/dashboard')) return null
  if (pathname?.startsWith('/onboarding')) return null
  if (pathname?.startsWith('/journeys')) return null
  if (pathname?.startsWith('/browse') && isLoggedIn) return null
  if (pathname?.startsWith('/products') && isLoggedIn) return null
  if (pathname?.startsWith('/community') && isLoggedIn) return null
  if (pathname?.startsWith('/subscribe') && isLoggedIn) return null
  if (pathname?.startsWith('/content') && isLoggedIn) return null

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
      <header className="sticky top-0 z-50 bg-[#1A1A1A]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={logoUrl || '/images/logo.png'}
              alt={brandName}
              width={140}
              height={36}
              className="h-7 w-auto"
              priority
            />
          </Link>

          {/* Desktop navigation */}
          {!isAuthPage && (
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${
                    pathname === item.href
                      ? 'text-white'
                      : 'text-white/60'
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
              <Link
                href="/"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                Tilbage
              </Link>
            ) : isLoggedIn ? (
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-3.5" />
                Log ud
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Log ind
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-white/90"
                >
                  Kom i gang
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          {!isAuthPage && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex size-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 sm:hidden"
              aria-label={mobileOpen ? 'Luk menu' : 'Åbn menu'}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}

          {/* Mobile: auth page back button */}
          {isAuthPage && (
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 hover:text-white sm:hidden"
            >
              Tilbage
            </Link>
          )}
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-[#1A1A1A] sm:hidden">
          <nav className="flex flex-col p-4">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}

            <div className="my-3 border-t border-white/10" />

            {isLoggedIn ? (
              <button
                onClick={() => {
                  setMobileOpen(false)
                  setShowLogoutDialog(true)
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-5" />
                Log ud
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  Log ind
                </Link>
                <Link
                  href="/signup"
                  className="mt-2 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-base font-medium text-[#1A1A1A] transition-colors hover:bg-white/90"
                >
                  Kom i gang
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log ud</AlertDialogTitle>
            <AlertDialogDescription>
              Du bliver logget ud af din konto. Er du sikker?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Log ud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
