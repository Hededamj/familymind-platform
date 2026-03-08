'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Home,
  MessageCircle,
  BookOpen,
  Compass,
  Shield,
  User,
  Bell,
  CreditCard,
  LogOut,
  ChevronUp,
} from 'lucide-react'

type Props = {
  brandName: string
  userName: string
  userEmail: string
  userRole: string
}

const navItems = [
  { href: '/dashboard', label: 'Hjem', icon: Home, exact: true },
  { href: '/community', label: 'Fællesskab', icon: MessageCircle, exact: false },
  { href: '/dashboard/courses', label: 'Mine forløb', icon: BookOpen, exact: false },
  { href: '/browse', label: 'Opdag', icon: Compass, exact: false },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AppSidebar({ brandName, userName, userEmail, userRole }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = userRole === 'ADMIN' || userRole === 'MODERATOR'

  function isActive(href: string, exact: boolean): boolean {
    if (!pathname) return false
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="hidden md:flex md:w-16 lg:w-[260px] md:flex-col md:shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sand)] h-screen sticky top-0 transition-[width] duration-200">
      {/* Logo */}
      <div className="px-6 py-6 md:flex md:items-center md:justify-center lg:justify-start">
        <Link
          href="/dashboard"
          className="font-serif text-xl text-[var(--foreground)] hover:opacity-80 transition-opacity"
          title={brandName}
        >
          <span className="hidden lg:inline">{brandName}</span>
          <span className="lg:hidden font-serif text-xl">{brandName.charAt(0)}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 md:px-1.5 lg:px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={`relative flex items-center gap-3 rounded-lg h-[44px] text-sm font-medium transition-colors md:justify-center md:px-0 lg:justify-start lg:px-3 min-w-10 ${
                    active
                      ? 'bg-white text-[var(--foreground)]'
                      : 'text-[var(--foreground)]/60 hover:bg-white/60'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-[var(--accent)]" />
                  )}
                  <Icon
                    className={`size-5 shrink-0 ${
                      active
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--foreground)]/40'
                    }`}
                  />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="md:px-1.5 lg:px-3 py-3">
        <div className="hidden lg:block border-t border-[var(--color-border)] mb-3" />
        {/* Admin link */}
        {isAdmin && (
          <Link
            href="/admin"
            title="Administration"
            className={`flex items-center gap-3 rounded-lg h-[44px] text-sm font-medium transition-colors mb-1 md:justify-center md:px-0 lg:justify-start lg:px-3 min-w-10 ${
              pathname?.startsWith('/admin')
                ? 'bg-white text-[var(--foreground)]'
                : 'text-[var(--foreground)]/60 hover:bg-white/60'
            }`}
          >
            <Shield
              className={`size-5 shrink-0 ${
                pathname?.startsWith('/admin')
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--foreground)]/40'
              }`}
            />
            <span className="hidden lg:inline">Administration</span>
          </Link>
        )}

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/60 md:justify-center md:px-0 lg:justify-start lg:px-3"
            title={userName}
          >
            {/* Avatar */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-semibold">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1 hidden lg:block">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {userName}
              </p>
              <p className="truncate text-xs text-[var(--foreground)]/50">
                {userEmail}
              </p>
            </div>
            <ChevronUp
              className={`size-4 shrink-0 text-[var(--foreground)]/40 transition-transform hidden lg:block ${
                dropdownOpen ? '' : 'rotate-180'
              }`}
            />
          </button>

          {/* Dropdown menu — opens upward */}
          {dropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[var(--color-border)] bg-white shadow-lg overflow-hidden z-50 md:left-auto md:right-auto md:w-56 lg:left-0 lg:right-0 lg:w-auto">
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--color-sand)] transition-colors"
                >
                  <User className="size-4 text-[var(--foreground)]/40" />
                  Rediger profil
                </Link>
                <Link
                  href="/dashboard/notifications"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--color-sand)] transition-colors"
                >
                  <Bell className="size-4 text-[var(--foreground)]/40" />
                  Notifikationer
                </Link>
                <Link
                  href="/dashboard/subscription"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--color-sand)] transition-colors"
                >
                  <CreditCard className="size-4 text-[var(--foreground)]/40" />
                  Abonnement
                </Link>
                <div className="mx-3 my-1 border-t border-[var(--color-border)]" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="size-4" />
                  Log ud
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
