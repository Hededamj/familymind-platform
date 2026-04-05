import { prisma } from '@/lib/prisma'
import { getUserActiveJourney, getJourneyProgress } from './journey.service'
import { getUserInProgressCourses } from './progress.service'
import { getRecommendations } from './onboarding.service'

export type DashboardState =
  | 'new_user'
  | 'active_journey'
  | 'active_journey_plus_courses'
  | 'no_journey_has_courses'
  | 'completed_journey'

export interface WeeklyFocus {
  days: Array<{
    id: string
    title: string | null
    position: number
    phaseTitle: string
    completed: boolean
    isCurrent: boolean
  }>
  completedCount: number
  totalCount: number
  currentDay: { id: string; title: string | null; position: number; phaseTitle: string } | null
}

export async function getCheckInPrompt(userId: string): Promise<string> {
  const activeJourney = await getUserActiveJourney(userId)

  if (activeJourney) {
    const phaseTitle = activeJourney.currentDay?.phase?.title
    if (phaseTitle) {
      return `Hvordan går det med ${phaseTitle}?`
    }
    return `Hvordan går det med ${activeJourney.journey.title}?`
  }

  // No active journey — check for completed journey
  const completedJourney = await prisma.userJourney.findFirst({
    where: { userId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
  })

  if (completedJourney) {
    return 'Tillykke med at gennemføre dit forløb! Hvad er dit næste mål?'
  }

  // No journey — check profile for challenge tag
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { primaryChallengeTagId: true },
  })

  if (!profile) {
    return 'Velkommen! Hvordan har du det i dag?'
  }

  if (profile.primaryChallengeTagId) {
    const tag = await prisma.contentTag.findUnique({
      where: { id: profile.primaryChallengeTagId },
    })
    if (tag) {
      return `Hvordan går det med ${tag.name}?`
    }
  }

  return 'Hvordan har du det i dag?'
}

function getAgeGroupLabel(childAges: number[]): string {
  const minAge = Math.min(...childAges)
  if (minAge < 12) return 'lille en'
  if (minAge <= 36) return 'tumling'
  if (minAge <= 72) return 'børnehavebarn'
  return 'skolebarn'
}

export async function getPersonalizedWelcome(
  userId: string,
  stateKey: DashboardState
): Promise<{ heading: string; body: string; ctaLabel: string | null; ctaUrl: string | null }> {
  const [dashboardMessage, profile] = await Promise.all([
    prisma.dashboardMessage.findUnique({ where: { stateKey } }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { childAges: true, primaryChallengeTagId: true },
    }),
  ])

  if (!dashboardMessage) {
    return { heading: 'Velkommen!', body: '', ctaLabel: null, ctaUrl: null }
  }

  if (!profile) {
    return {
      heading: dashboardMessage.heading,
      body: dashboardMessage.body,
      ctaLabel: dashboardMessage.ctaLabel ?? null,
      ctaUrl: dashboardMessage.ctaUrl ?? null,
    }
  }

  // Build personalization context
  const childAges = Array.isArray(profile.childAges) && profile.childAges.length > 0
    ? (profile.childAges as number[])
    : null

  let tagName: string | null = null
  if (profile.primaryChallengeTagId) {
    const tag = await prisma.contentTag.findUnique({
      where: { id: profile.primaryChallengeTagId },
    })
    tagName = tag?.name ?? null
  }

  // Append personalized context to body if we have data
  let personalizedBody = dashboardMessage.body
  if (childAges || tagName) {
    const parts: string[] = []
    if (tagName) parts.push(tagName)
    if (childAges) parts.push(`din ${getAgeGroupLabel(childAges)}`)
    personalizedBody = `${dashboardMessage.body} Vi har fokus på ${parts.join(' for ')}.`.trim()
  }

  return {
    heading: dashboardMessage.heading,
    body: personalizedBody,
    ctaLabel: dashboardMessage.ctaLabel ?? null,
    ctaUrl: dashboardMessage.ctaUrl ?? null,
  }
}

export async function getWeeklyFocus(userId: string): Promise<WeeklyFocus | null> {
  const activeJourney = await getUserActiveJourney(userId)

  if (!activeJourney || !activeJourney.currentDayId) {
    return null
  }

  // Flatten all days preserving phase title per day
  const allDays = activeJourney.journey.phases.flatMap(p =>
    p.days.map(d => ({ ...d, phaseTitle: p.title ?? '' }))
  )

  const currentIndex = allDays.findIndex(d => d.id === activeJourney.currentDayId)
  if (currentIndex === -1) {
    return null
  }

  // Window: current day + up to 6 more (7 days total)
  const windowDays = allDays.slice(currentIndex, currentIndex + 7)

  // Build set of completed day IDs from check-ins
  const completedDayIds = new Set(activeJourney.checkIns.map(c => c.dayId))

  // Map window to include completed and isCurrent flags
  const days = windowDays.map(d => ({
    id: d.id,
    title: d.title ?? null,
    position: d.position,
    phaseTitle: d.phaseTitle,
    completed: completedDayIds.has(d.id),
    isCurrent: d.id === activeJourney.currentDayId,
  }))

  // Count completed days within the window only
  const completedCount = days.filter(d => d.completed).length

  const firstDay = days[0]
  const currentDay = firstDay
    ? { id: firstDay.id, title: firstDay.title, position: firstDay.position, phaseTitle: firstDay.phaseTitle }
    : null

  return {
    days,
    completedCount,
    totalCount: days.length,
    currentDay,
  }
}

export async function getDashboardState(userId: string) {
  const [activeJourney, inProgressCourses, recommendations, recentlyCompleted] =
    await Promise.all([
      getUserActiveJourney(userId),
      getUserInProgressCourses(userId),
      getRecommendations(userId),
      prisma.userJourney.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        include: { journey: true },
      }),
    ])

  let stateKey: DashboardState
  let journeyProgress: Awaited<ReturnType<typeof getJourneyProgress>> | null = null

  if (activeJourney && activeJourney.currentDay) {
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

  // Resolve all personalized fields in parallel
  const [checkInPrompt, weeklyFocus, personalizedWelcome] = await Promise.all([
    getCheckInPrompt(userId),
    getWeeklyFocus(userId),
    getPersonalizedWelcome(userId, stateKey),
  ])

  return {
    stateKey,
    message,
    checkInPrompt,
    weeklyFocus,
    personalizedWelcome,
    activeJourney,
    journeyProgress,
    inProgressCourses,
    recommendations,
    recentlyCompleted,
  }
}
