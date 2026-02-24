import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { ArrowLeft } from 'lucide-react'
import { AdminNav } from './_components/admin-nav'

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
      {/* Warm light sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-border bg-sand">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="px-6 py-5">
            <Link href="/admin" className="block">
              <span className="font-serif text-lg text-foreground">{tenant.brandName}</span>
              <span className="ml-1.5 text-xs font-medium text-foreground/30">Admin</span>
            </Link>
          </div>

          <AdminNav />

          {/* Bottom */}
          <div className="border-t border-border px-3 py-3">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/40 transition-all duration-150 hover:bg-sand-dark hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-colors duration-150 group-hover:text-foreground/60" />
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
