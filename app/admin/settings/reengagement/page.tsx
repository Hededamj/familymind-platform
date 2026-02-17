import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReEngagementTierManager } from './_components/reengagement-tier-manager'

export default async function ReEngagementSettingsPage() {
  await requireAdmin()

  const tiers = await prisma.reEngagementTier.findMany({
    include: { emailTemplate: true },
    orderBy: { tierNumber: 'asc' },
  })

  const emailTemplates = await prisma.emailTemplate.findMany({
    where: { isActive: true },
    orderBy: { templateKey: 'asc' },
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
            Genaktiveringsniveauer
          </h1>
          <p className="text-muted-foreground">
            Konfigurer hvornaar og hvordan inaktive brugere kontaktes
          </p>
        </div>
      </div>

      <Separator />

      <ReEngagementTierManager tiers={tiers} emailTemplates={emailTemplates} />
    </div>
  )
}
