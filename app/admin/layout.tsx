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
      {/* Warm editorial sidebar */}
      <aside className="w-[272px] shrink-0 border-r border-border/60 bg-sand">
        <div className="flex h-full flex-col">
          {/* Brand — serif for warmth */}
          <div className="px-7 pb-2 pt-6">
            <Link href="/admin" className="group block">
              <span className="font-serif text-[17px] text-foreground transition-colors duration-200 group-hover:text-foreground/70">
                {tenant.brandName}
              </span>
              <span className="ml-2 rounded-md bg-sand-dark px-1.5 py-0.5 text-[10px] font-medium text-warm-gray">
                admin
              </span>
            </Link>
          </div>

          {/* Subtle divider */}
          <div className="mx-6 mb-2 border-b border-border/40" />

          <AdminNav />

          {/* Bottom — back to dashboard */}
          <div className="border-t border-border/40 px-4 py-3">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-foreground/30 transition-all duration-200 hover:bg-white/60 hover:text-foreground/60"
            >
              <ArrowLeft className="size-[15px] transition-all duration-200 group-hover:-translate-x-0.5" />
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
