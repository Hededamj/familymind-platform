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
    <nav className="flex-1 overflow-y-auto px-5 py-3">
      {navSections.map((section, i) => (
        <div key={section.label} className={i > 0 ? 'mt-9' : 'mt-1'}>
          {/* Section label — confident serif, warm cream */}
          <div className="mb-3 px-3 font-serif text-xs tracking-wide text-[#F5F0EB]/40">
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
                    group flex items-center gap-3.5 rounded-xl px-3 py-3
                    text-[14px] font-medium tracking-wide
                    transition-all duration-200 ease-out
                    ${active
                      ? 'bg-[#F5F0EB]/10 text-[#F5F0EB]'
                      : 'text-[#F5F0EB]/40 hover:bg-[#F5F0EB]/[0.06] hover:text-[#F5F0EB]/75'
                    }
                  `}
                >
                  {/* Accent indicator */}
                  {active && (
                    <span className="absolute left-5 h-5 w-[3px] rounded-full bg-coral" />
                  )}
                  <item.icon
                    className={`size-[18px] transition-all duration-200 ${
                      active
                        ? 'text-coral'
                        : 'text-[#F5F0EB]/25 group-hover:text-[#F5F0EB]/50'
                    }`}
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
