import { getCurrentUser } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { AppSidebar } from './app-sidebar'
import { BottomTabBar } from './bottom-tab-bar'
import { AppTopbar } from './app-topbar'

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, tenant] = await Promise.all([
    getCurrentUser(),
    getTenantConfig(),
  ])

  if (!user) return <>{children}</>

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AppSidebar
        brandName={tenant.brandName}
        userName={displayName}
        userEmail={user.email}
        userRole={user.role}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopbar brandName={tenant.brandName} />
        <main className="min-w-0 flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </div>
  )
}
