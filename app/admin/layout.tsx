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
      {/* Warm dark sidebar */}
      <aside className="w-[280px] shrink-0 bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="px-6 py-5">
            <Link href="/admin" className="block">
              <span className="font-serif text-lg text-white">{tenant.brandName}</span>
              <span className="ml-1.5 text-xs font-medium text-sidebar-primary/50">Admin</span>
            </Link>
          </div>

          <AdminNav />

          {/* Bottom */}
          <div className="border-t border-sidebar-border px-3 py-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 transition-all duration-150 hover:bg-white/[0.08] hover:text-white/90"
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
