import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DashboardMessagesManager } from './_components/dashboard-messages-manager'

export default async function DashboardSettingsPage() {
  await requireAdmin()

  const messages = await prisma.dashboardMessage.findMany({
    orderBy: { stateKey: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Beskeder
          </h1>
          <p className="text-muted-foreground">
            Rediger tilstandsbaserede beskeder på brugerens dashboard
          </p>
        </div>
      </div>

      <Separator />

      <DashboardMessagesManager messages={messages} />
    </div>
  )
}
