import { prisma } from '@/lib/prisma'
import { getUserActiveJourney, getJourneyProgress } from './journey.service'
import { getUserInProgressCourses } from './progress.service'
import { getRecommendations } from './onboarding.service'

type DashboardState =
  | 'new_user'
  | 'active_journey'
  | 'active_journey_plus_courses'
  | 'no_journey_has_courses'
  | 'completed_journey'

export async function getDashboardState(userId: string) {
  const activeJourney = await getUserActiveJourney(userId)
  const inProgressCourses = await getUserInProgressCourses(userId)
  const recommendations = await getRecommendations(userId)

  // Check for recently completed journey
  const recentlyCompleted = await prisma.userJourney.findFirst({
    where: { userId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: { journey: true },
  })

  let stateKey: DashboardState
  let journeyProgress = null

  if (activeJourney) {
    journeyProgress = await getJourneyProgress(activeJourney.id)
    stateKey = inProgressCourses.length > 0 ? 'active_journey_plus_courses' : 'active_journey'
  } else if (inProgressCourses.length > 0) {
    stateKey = 'no_journey_has_courses'
  } else if (recentlyCompleted) {
    stateKey = 'completed_journey'
  } else {
    stateKey = 'new_user'
  }

  // Load dashboard message for this state
  const message = await prisma.dashboardMessage.findUnique({ where: { stateKey } })

  return {
    stateKey,
    message,
    activeJourney,
    journeyProgress,
    inProgressCourses,
    recommendations,
    recentlyCompleted,
  }
}
