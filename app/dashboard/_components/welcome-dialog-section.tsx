import { prisma } from '@/lib/prisma'
import { getUserActiveJourney } from '@/lib/services/journey.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { WelcomeDialog } from '@/components/welcome-dialog'

export async function WelcomeDialogSection({
  userId,
  hasSeenWelcome,
}: {
  userId: string
  hasSeenWelcome: boolean
}) {
  if (hasSeenWelcome) return null

  const [activeJourney, recentlyCompleted, tenantConfig] = await Promise.all([
    getUserActiveJourney(userId),
    prisma.userJourney.findFirst({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { id: true },
    }),
    getTenantConfig(),
  ])

  if (recentlyCompleted) return null

  return (
    <WelcomeDialog
      brandName={tenantConfig.brandName}
      hasActiveJourney={!!activeJourney}
    />
  )
}
