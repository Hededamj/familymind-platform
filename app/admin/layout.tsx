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
  Tag,
  Users,
  UserSearch,
  Shield,
  Palette,
} from 'lucide-react'

const navItems = [
  { href: '/admin/users', label: 'Brugere', icon: UserSearch },
  { href: '/admin/content', label: 'Indhold', icon: FileText },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/products', label: 'Produkter', icon: Package },
  { href: '/admin/discounts', label: 'Rabatkoder', icon: Ticket },
  { href: '/admin/journeys', label: 'Forløb', icon: Map },
  { href: '/admin/cohorts', label: 'Kohorter', icon: Users },
  { href: '/admin/moderation', label: 'Moderering', icon: Shield },
  { href: '/admin/settings/branding', label: 'Branding', icon: Palette },
  { href: '/admin/settings', label: 'Indstillinger', icon: Settings },
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
          <nav className="flex-1 space-y-0.5 px-3 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
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
