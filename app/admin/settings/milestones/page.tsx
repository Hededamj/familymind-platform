import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MilestoneManager } from './_components/milestone-manager'

export default async function MilestoneSettingsPage() {
  await requireAdmin()

  const milestones = await prisma.milestoneDefinition.findMany({
    orderBy: [{ triggerType: 'asc' }, { triggerValue: 'asc' }],
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
            Milepælsdefinitioner
          </h1>
          <p className="text-muted-foreground">
            Konfigurer milepælene og deres fejringsmeddelelser
          </p>
        </div>
      </div>

      <Separator />

      <MilestoneManager milestones={milestones} />
    </div>
  )
}
