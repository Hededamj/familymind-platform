import { prisma } from '@/lib/prisma'
import {
  getPersonalizedWelcome,
  type DashboardState,
} from '@/lib/services/dashboard.service'
import { getUserActiveJourney } from '@/lib/services/journey.service'
import { getUserInProgressCourses } from '@/lib/services/progress.service'
import { DashboardMessageBanner } from './dashboard-message-banner'
import { CompletedJourneyCard } from './completed-journey-card'

async function resolveStateKey(userId: string): Promise<{
  stateKey: DashboardState
  recentlyCompletedTitle: string | null
}> {
  const [activeJourney, inProgressCourses, recentlyCompleted] = await Promise.all([
    getUserActiveJourney(userId),
    getUserInProgressCourses(userId),
    prisma.userJourney.findFirst({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      include: { journey: true },
    }),
  ])

  let stateKey: DashboardState
  if (activeJourney && activeJourney.currentDay) {
    stateKey = inProgressCourses.length > 0 ? 'active_journey_plus_courses' : 'active_journey'
  } else if (inProgressCourses.length > 0) {
    stateKey = 'no_journey_has_courses'
  } else if (recentlyCompleted) {
    stateKey = 'completed_journey'
  } else {
    stateKey = 'new_user'
  }

  return {
    stateKey,
    recentlyCompletedTitle: recentlyCompleted?.journey.title ?? null,
  }
}

export async function PersonalizedWelcomeSubtitle({ userId }: { userId: string }) {
  const { stateKey } = await resolveStateKey(userId)
  const personalizedWelcome = await getPersonalizedWelcome(userId, stateKey)

  if (!personalizedWelcome?.body) return null

  return (
    <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
      {personalizedWelcome.body}
    </p>
  )
}

export async function CompletedJourneyBanner({ userId }: { userId: string }) {
  const { recentlyCompletedTitle } = await resolveStateKey(userId)
  if (!recentlyCompletedTitle) return null
  return <CompletedJourneyCard journeyTitle={recentlyCompletedTitle} />
}

export async function DashboardMessageSection({ userId }: { userId: string }) {
  const { stateKey } = await resolveStateKey(userId)
  const personalizedWelcome = await getPersonalizedWelcome(userId, stateKey)

  if (!personalizedWelcome?.ctaLabel || !personalizedWelcome?.ctaUrl) return null

  return (
    <DashboardMessageBanner
      heading={personalizedWelcome.heading}
      body={personalizedWelcome.body}
      ctaLabel={personalizedWelcome.ctaLabel}
      ctaUrl={personalizedWelcome.ctaUrl}
    />
  )
}
