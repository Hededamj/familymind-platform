import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NotificationScheduleManager } from './_components/notification-schedule-manager'

export default async function NotificationScheduleSettingsPage() {
  await requireAdmin()

  const schedules = await prisma.notificationSchedule.findMany({
    orderBy: { notificationType: 'asc' },
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
            Notifikationsplan
          </h1>
          <p className="text-muted-foreground">
            Konfigurer hvornår notifikationer sendes til brugerne
          </p>
        </div>
      </div>

      <Separator />

      <NotificationScheduleManager schedules={schedules} />
    </div>
  )
}
