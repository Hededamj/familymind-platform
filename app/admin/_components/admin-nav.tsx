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
  MessageSquare,
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
      { href: '/admin/cohorts', label: 'Community', icon: MessageSquare },
      { href: '/admin/settings/tags', label: 'Segmentering', icon: Tags },
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
  return pathname.startsWith(href)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-2">
      {navSections.map((section, i) => (
        <div key={section.label} className={i > 0 ? 'mt-8' : 'mt-2'}>
          {/* Editorial section header — serif font, warm tone */}
          <div className="mb-3 px-3 font-serif text-[11px] tracking-wide text-warm-gray">
            {section.label}
          </div>

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                    text-[13px] font-medium
                    transition-all duration-200 ease-out
                    ${active
                      ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]'
                      : 'text-foreground/45 hover:bg-white/70 hover:text-foreground/80 hover:shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                    }
                  `}
                >
                  {/* Warm accent bar on active */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-coral" />
                  )}
                  <item.icon
                    className={`size-[17px] transition-all duration-200 ${
                      active
                        ? 'text-coral'
                        : 'text-foreground/25 group-hover:text-foreground/50'
                    }`}
                    strokeWidth={1.75}
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
