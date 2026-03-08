'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Package,
  Ticket,
  Map,
  Settings,
  Tags,
  Users,
  UsersRound,
  MessageSquare,
  Sparkles,
  Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavSection = {
  label: string
  items: { href: string; label: string; icon: LucideIcon }[]
}

const navSections: NavSection[] = [
  {
    label: 'Indhold',
    items: [
      { href: '/admin/products', label: 'Produkter', icon: Package },
      { href: '/admin/content', label: 'Lektioner', icon: FileText },
      { href: '/admin/journeys', label: 'Forløb', icon: Map },
      { href: '/admin/discounts', label: 'Rabatkoder', icon: Ticket },
    ],
  },
  {
    label: 'Medlemmer',
    items: [
      { href: '/admin/users', label: 'Brugere', icon: Users },
      { href: '/admin/cohorts', label: 'Kohorter', icon: UsersRound },
      { href: '/admin/settings/tags', label: 'Segmentering', icon: Tags },
    ],
  },
  {
    label: 'Fællesskab',
    items: [
      { href: '/admin/community/rooms', label: 'Rum', icon: MessageSquare },
      { href: '/admin/community/prompts', label: 'Prompts', icon: Sparkles },
      { href: '/admin/moderation', label: 'Moderering', icon: Shield },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Indstillinger', icon: Settings },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin/settings') return pathname === '/admin/settings'
  if (href === '/admin/community/rooms') return pathname.startsWith('/admin/community/rooms')
  if (href === '/admin/community/prompts') return pathname.startsWith('/admin/community/prompts')
  return pathname.startsWith(href)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto px-5 py-3">
      {navSections.map((section, i) => (
        <div key={section.label} className={i > 0 ? 'mt-7' : 'mt-1'}>
          <div className="mb-3 px-3 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/25">
            {section.label}
          </div>

          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center gap-3.5 rounded-lg px-3 py-2.5
                    text-[14px] font-medium transition-all duration-200
                    ${active
                      ? 'bg-white text-[var(--foreground)]'
                      : 'text-[var(--foreground)]/50 hover:bg-white/60 hover:text-[var(--foreground)]'
                    }
                  `}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                  )}
                  <item.icon
                    className={`size-[18px] ${active ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/30'}`}
                    strokeWidth={1.5}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
