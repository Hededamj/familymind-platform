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
    <>
      {/* Hover styles — Tailwind opacity shorthand may not generate on dark bg */}
      <style>{`
        .admin-nav-item {
          transition: all 200ms ease-out;
        }
        .admin-nav-item:not(.admin-nav-active):hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.75);
        }
        .admin-nav-item:not(.admin-nav-active):hover .admin-nav-icon {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      <nav className="flex-1 overflow-y-auto px-5 py-3">
        {navSections.map((section, i) => (
          <div key={section.label} className={i > 0 ? 'mt-9' : 'mt-1'}>
            <div className="mb-3 px-3 font-serif text-xs tracking-wide" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
                      admin-nav-item relative flex items-center gap-3.5 rounded-xl px-3 py-3
                      text-[14px] font-medium tracking-wide
                      ${active ? 'admin-nav-active' : ''}
                    `}
                    style={{
                      background: active ? 'rgba(255,255,255,0.12)' : undefined,
                      color: active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                        style={{ background: '#E8715A' }}
                      />
                    )}
                    <item.icon
                      className="admin-nav-icon size-[18px]"
                      strokeWidth={1.5}
                      style={{
                        color: active ? '#E8715A' : 'rgba(255,255,255,0.2)',
                        transition: 'all 200ms ease-out',
                      }}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  )
}
