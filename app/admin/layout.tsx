import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import {
  FileText,
  Package,
  Ticket,
  Map,
  Settings,
  ArrowLeft,
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [, tenant] = await Promise.all([
    requireAdmin(),
    getTenantConfig(),
  ])

  return (
    <div className="flex min-h-screen">
      {/* Dark sidebar */}
      <aside className="w-[280px] shrink-0 bg-[#1A1A1A]">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="px-6 py-5">
            <Link href="/admin" className="block">
              <span className="font-serif text-lg text-white">{tenant.brandName}</span>
              <span className="ml-1.5 text-xs font-medium text-white/40">Admin</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2">
            {navSections.map((section) => (
              <div key={section.label} className="mb-4">
                <div className="mb-1 px-3 pt-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom */}
          <div className="border-t border-white/10 px-3 py-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Tilbage til dashboard
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
