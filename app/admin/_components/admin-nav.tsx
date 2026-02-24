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
  // Exact match for /admin/settings to avoid matching /admin/settings/tags
  if (href === '/admin/settings') return pathname === '/admin/settings'
  return pathname.startsWith(href)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4">
      {navSections.map((section) => (
        <div key={section.label} className="mb-6">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
            {section.label}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-sand-dark text-foreground shadow-sm'
                      : 'text-foreground/50 hover:bg-sand hover:text-foreground'
                  }`}
                >
                  <item.icon
                    className={`size-[18px] transition-colors duration-150 ${
                      active
                        ? 'text-foreground/80'
                        : 'text-foreground/30 group-hover:text-foreground/60'
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
