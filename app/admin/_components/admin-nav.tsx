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
    <nav className="flex-1 px-3 py-2">
      {navSections.map((section) => (
        <div key={section.label} className="mb-5">
          <div className="mb-1.5 px-3 pt-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-primary/50">
            {section.label}
          </div>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-sidebar-primary/15 text-white'
                      : 'text-white/50 hover:bg-white/[0.08] hover:text-white/90'
                  }`}
                >
                  <item.icon
                    className={`size-[18px] ${active ? 'text-sidebar-primary' : ''}`}
                    strokeWidth={1.75}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
