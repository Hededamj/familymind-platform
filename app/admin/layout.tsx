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
    <div
      className="flex min-h-screen"
      style={{
        // Override brand blue with warm neutral for admin context
        '--primary': '#1A1A1A',
        '--primary-foreground': '#FAFAF8',
        '--ring': '#1A1A1A',
      } as React.CSSProperties}
    >
      {/* Rich warm sidebar */}
      <aside className="relative w-[280px] shrink-0 bg-[#1E1B18]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#262220] to-[#1E1B18]" />

        <div className="relative flex h-full flex-col">
          {/* Brand */}
          <div className="px-8 pb-4 pt-8">
            <Link href="/admin" className="group block">
              <span className="font-serif text-xl tracking-wide text-white/90 transition-colors duration-200 group-hover:text-white/70">
                {tenant.brandName}
              </span>
            </Link>
            <p className="mt-1 text-[11px] font-medium tracking-widest text-white/15">
              ADMIN
            </p>
          </div>

          <div className="mx-7 border-b border-white/5" />

          <AdminNav />

          {/* Bottom */}
          <div className="border-t border-white/5 px-5 py-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium text-white/20 transition-all duration-200 hover:text-white/50"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
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
