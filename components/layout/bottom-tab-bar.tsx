'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, BookOpen, Compass, User } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Hjem', icon: Home, exact: true },
  { href: '/community', label: 'Fællesskab', icon: MessageCircle, exact: false },
  { href: '/dashboard/courses', label: 'Forløb', icon: BookOpen, exact: false },
  { href: '/browse', label: 'Opdag', icon: Compass, exact: false },
  { href: '/dashboard/profile', label: 'Profil', icon: User, exact: false },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--border)] bg-[var(--background)] md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname?.startsWith(tab.href)
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center ${
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--foreground)]/40'
            }`}
          >
            <Icon
              className="size-5"
              strokeWidth={isActive ? 2 : 1.5}
            />
            <span className="text-[10px]">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
