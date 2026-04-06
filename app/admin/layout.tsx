import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { ArrowLeft } from 'lucide-react'
import { AdminNav } from './_components/admin-nav'
import { AdminMobileNav } from './_components/admin-mobile-nav'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, tenant] = await Promise.all([
    requireAdmin(),
    getTenantConfig(),
  ])

  const initial = (user.name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminMobileNav brandName={tenant.brandName} />

      {/* Light sand sidebar */}
      <aside className="hidden w-[280px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sand)] md:block">
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="px-8 pb-2 pt-8">
            <Link href="/admin" className="group block">
              <span className="font-serif text-xl tracking-wide text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--foreground)]/70">
                {tenant.brandName}
              </span>
            </Link>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/20">
              ADMIN
            </p>
          </div>

          {/* Back link */}
          <div className="px-5 pb-2 pt-3">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--accent)] transition-all duration-200 hover:bg-white/60"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Tilbage til min side
            </Link>
          </div>

          <div className="mx-7 border-b border-[var(--foreground)]/5" />

          <AdminNav />

          {/* Bottom: user avatar */}
          <div className="border-t border-[var(--foreground)]/5 px-5 py-4">
            <div className="flex items-center gap-3 px-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[var(--foreground)]">
                  {user.name ?? user.email}
                </p>
                <p className="text-[12px] text-[var(--foreground)]/40">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <AdminBreadcrumbs />
          {children}
        </div>
      </main>
    </div>
  )
}
