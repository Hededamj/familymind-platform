import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  FileText,
  Package,
  Ticket,
  Map,
  Settings,
  ArrowLeft,
  Tag,
  Users,
  Shield,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/admin/content', label: 'Indhold', icon: FileText },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/products', label: 'Produkter', icon: Package },
  { href: '/admin/discounts', label: 'Rabatkoder', icon: Ticket },
  { href: '/admin/journeys', label: 'Rejser', icon: Map },
  { href: '/admin/cohorts', label: 'Kohorter', icon: Users },
  { href: '/admin/moderation', label: 'Moderering', icon: Shield },
  { href: '/admin/settings', label: 'Indstillinger', icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-muted/30">
        <div className="flex h-full flex-col">
          <div className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">
              FamilyMind Admin
            </h2>
          </div>
          <Separator />
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Separator />
          <div className="p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="size-4" />
              Tilbage til dashboard
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
