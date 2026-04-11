import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userJourney: {
      findFirst: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
    contentTag: {
      findUnique: vi.fn(),
    },
    dashboardMessage: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock journey service
vi.mock('../journey.service', () => ({
  getUserActiveJourney: vi.fn(),
  getJourneyProgress: vi.fn(),
}))

// Mock progress service
vi.mock('../progress.service', () => ({
  getUserInProgressCourses: vi.fn(),
}))

// Mock onboarding service
vi.mock('../onboarding.service', () => ({
  getRecommendations: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getUserActiveJourney } from '../journey.service'
import { getCheckInPrompt, getPersonalizedWelcome, getWeeklyFocus, getDashboardState } from '../dashboard.service'

const mockedPrisma = prisma as any
const mockedGetUserActiveJourney = getUserActiveJourney as ReturnType<typeof vi.fn>

describe('getCheckInPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns phase title when active journey has a current day with phase', async () => {
    mockedGetUserActiveJourney.mockResolvedValue({
      id: 'uj1',
      journey: { title: 'Søvn og vaner' },
      currentDay: {
        phase: { title: 'Fase 1: Etablering' },
      },
      checkIns: [],
    })

    const result = await getCheckInPrompt('user1')
    expect(result).toBe('Hvordan går det med Fase 1: Etablering?')
  })

  it('falls back to journey title when active journey has no phase on currentDay', async () => {
    mockedGetUserActiveJourney.mockResolvedValue({
      id: 'uj1',
      journey: { title: 'Søvn og vaner' },
      currentDay: {
        phase: null,
      },
      checkIns: [],
    })

    const result = await getCheckInPrompt('user1')
    expect(result).toBe('Hvordan går det med Søvn og vaner?')
  })

  it('returns completed journey message when no active journey but completed one exists', async () => {
    mockedGetUserActiveJourney.mockResolvedValue(null)
    mockedPrisma.userJourney.findFirst.mockResolvedValue({ id: 'uj2', status: 'COMPLETED' })

    const result = await getCheckInPrompt('user1')
    expect(result).toBe('Tillykke med at gennemføre dit forløb! Hvad er dit næste mål?')
  })

  it('returns challenge tag prompt when no journey but user has primaryChallengeTagId', async () => {
    mockedGetUserActiveJourney.mockResolvedValue(null)
    mockedPrisma.userJourney.findFirst.mockResolvedValue(null)
    mockedPrisma.userProfile.findUnique.mockResolvedValue({ primaryChallengeTagId: 'tag1' })
    mockedPrisma.contentTag.findUnique.mockResolvedValue({ id: 'tag1', name: 'Søvn' })

    const result = await getCheckInPrompt('user1')
    expect(result).toBe('Hvordan går det med Søvn?')
  })

  it('returns new user welcome when no profile exists', async () => {
    mockedGetUserActiveJourney.mockResolvedValue(null)
    mockedPrisma.userJourney.findFirst.mockResolvedValue(null)
    mockedPrisma.userProfile.findUnique.mockResolvedValue(null)

    const result = await getCheckInPrompt('user1')
    expect(result).toBe('Velkommen! Hvordan har du det i dag?')
  })

  it('returns generic prompt when profile exists but has no challenge tag', async () => {
    mockedGetUserActiveJourney.mockResolvedValue(null)
    mockedPrisma.userJourney.findFirst.mockResolvedValue(null)
    mockedPrisma.userProfile.findUnique.mockResolvedValue({ primaryChallengeTagId: null })

    const result = await getCheckInPrompt('user1')
    expect(result).toBe('Hvordan har du det i dag?')
  })
})

describe('getPersonalizedWelcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns personalized message with both age group and challenge tag', async () => {
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue({
      stateKey: 'active_journey',
      heading: 'Hej med dig',
      body: 'Du er i gang med et forløb.',
      ctaLabel: null,
      ctaUrl: null,
    })
    mockedPrisma.userProfile.findUnique.mockResolvedValue({
      childAges: [2],
      primaryChallengeTagId: 'tag1',
    })
    mockedPrisma.contentTag.findUnique.mockResolvedValue({ id: 'tag1', name: 'søvn' })

    const result = await getPersonalizedWelcome('user1', 'active_journey')
    expect(result.heading).toBe('Hej med dig')
    expect(result.body).toContain('søvn')
    expect(result.body).toContain('tumling')
  })

  it('returns personalized message with age group only when no challenge tag', async () => {
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue({
      stateKey: 'new_user',
      heading: 'Velkommen',
      body: 'Start her.',
      ctaLabel: null,
      ctaUrl: null,
    })
    mockedPrisma.userProfile.findUnique.mockResolvedValue({
      childAges: [0.5],
      primaryChallengeTagId: null,
    })

    const result = await getPersonalizedWelcome('user1', 'new_user')
    expect(result.body).toContain('lille en')
  })

  it('returns personalized message with challenge tag only when no childAges', async () => {
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue({
      stateKey: 'new_user',
      heading: 'Velkommen',
      body: 'Start her.',
      ctaLabel: null,
      ctaUrl: null,
    })
    mockedPrisma.userProfile.findUnique.mockResolvedValue({
      childAges: null,
      primaryChallengeTagId: 'tag2',
    })
    mockedPrisma.contentTag.findUnique.mockResolvedValue({ id: 'tag2', name: 'grænser' })

    const result = await getPersonalizedWelcome('user1', 'new_user')
    expect(result.body).toContain('grænser')
  })

  it('returns raw DashboardMessage when no profile exists', async () => {
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue({
      stateKey: 'new_user',
      heading: 'Velkommen',
      body: 'Kom godt i gang.',
      ctaLabel: 'Start',
      ctaUrl: '/onboarding',
    })
    mockedPrisma.userProfile.findUnique.mockResolvedValue(null)

    const result = await getPersonalizedWelcome('user1', 'new_user')
    expect(result.heading).toBe('Velkommen')
    expect(result.body).toBe('Kom godt i gang.')
    expect(result.ctaLabel).toBe('Start')
    expect(result.ctaUrl).toBe('/onboarding')
  })

  it('returns default when no DashboardMessage found', async () => {
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue(null)
    mockedPrisma.userProfile.findUnique.mockResolvedValue(null)

    const result = await getPersonalizedWelcome('user1', 'new_user')
    expect(result.heading).toBe('Velkommen!')
    expect(result.body).toBe('')
    expect(result.ctaLabel).toBeNull()
    expect(result.ctaUrl).toBeNull()
  })
})

// Helper: build a fake active journey with N total days, current at index currentIndex (0-based)
function makeJourney(totalDays: number, currentIndex: number, completedIndexes: number[] = []) {
  const days = Array.from({ length: totalDays }, (_, i) => ({
    id: `day-${i + 1}`,
    title: `Dag ${i + 1}`,
    position: i + 1,
  }))
  const checkIns = completedIndexes.map(idx => ({ dayId: `day-${idx + 1}`, completedAt: new Date() }))
  return {
    id: 'uj1',
    currentDayId: `day-${currentIndex + 1}`,
    journey: {
      title: 'Test Journey',
      phases: [
        {
          title: 'Fase 1',
          days,
        },
      ],
    },
    currentDay: {
      id: `day-${currentIndex + 1}`,
      phase: { title: 'Fase 1' },
    },
    checkIns,
  }
}

const mockedGetUserActiveJourneyFn = getUserActiveJourney as ReturnType<typeof vi.fn>

describe('getWeeklyFocus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no active journey', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(null)
    const result = await getWeeklyFocus('user1')
    expect(result).toBeNull()
  })

  it('returns null when active journey has no currentDayId', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue({
      id: 'uj1',
      currentDayId: null,
      journey: { title: 'Test', phases: [] },
      currentDay: null,
      checkIns: [],
    })
    const result = await getWeeklyFocus('user1')
    expect(result).toBeNull()
  })

  it('returns 7 days from current position when at day 3 of 14 (index 2)', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(14, 2))
    const result = await getWeeklyFocus('user1')
    expect(result).not.toBeNull()
    expect(result!.totalCount).toBe(7)
    expect(result!.days[0].isCurrent).toBe(true)
    expect(result!.days[0].id).toBe('day-3')
    expect(result!.days[6].id).toBe('day-9')
    expect(result!.completedCount).toBe(0)
  })

  it('returns only remaining days when near end (day 12 of 14, index 11)', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(14, 11))
    const result = await getWeeklyFocus('user1')
    expect(result).not.toBeNull()
    expect(result!.totalCount).toBe(3)
    expect(result!.days[0].id).toBe('day-12')
    expect(result!.days[2].id).toBe('day-14')
  })

  it('counts completed days within the window only', async () => {
    // Day 1 of 14, days 0 and 1 completed (day-1 and day-2)
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(14, 0, [0, 1]))
    const result = await getWeeklyFocus('user1')
    expect(result).not.toBeNull()
    // Window is days 1-7. day-1 (index 0) and day-2 (index 1) are both in window
    expect(result!.completedCount).toBe(2)
  })

  it('does not count completed days outside the window', async () => {
    // Current at day 8 (index 7), completedIndexes are days 0-6 (outside window)
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(14, 7, [0, 1, 2, 3, 4, 5, 6]))
    const result = await getWeeklyFocus('user1')
    expect(result).not.toBeNull()
    // Window is days 8-14. None of days 1-7 are in window.
    expect(result!.completedCount).toBe(0)
  })

  it('sets isCurrent only on the first day (the currentDayId day)', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(14, 2))
    const result = await getWeeklyFocus('user1')
    const currentDays = result!.days.filter(d => d.isCurrent)
    expect(currentDays).toHaveLength(1)
    expect(currentDays[0].id).toBe('day-3')
  })

  it('includes phaseTitle for each day', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(7, 0))
    const result = await getWeeklyFocus('user1')
    expect(result!.days.every(d => d.phaseTitle === 'Fase 1')).toBe(true)
  })

  it('sets currentDay on the return object', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(makeJourney(14, 4))
    const result = await getWeeklyFocus('user1')
    expect(result!.currentDay).not.toBeNull()
    expect(result!.currentDay!.id).toBe('day-5')
  })
})

import { getUserInProgressCourses } from '../progress.service'
import { getRecommendations } from '../onboarding.service'
const mockedGetUserInProgressCourses = getUserInProgressCourses as ReturnType<typeof vi.fn>
const mockedGetRecommendations = getRecommendations as ReturnType<typeof vi.fn>
import { getJourneyProgress } from '../journey.service'
const mockedGetJourneyProgress = getJourneyProgress as ReturnType<typeof vi.fn>

describe('getDashboardState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns checkInPrompt, weeklyFocus, and personalizedWelcome alongside existing fields', async () => {
    const journey = makeJourney(14, 2)
    mockedGetUserActiveJourneyFn.mockResolvedValue(journey)
    mockedGetUserInProgressCourses.mockResolvedValue([])
    mockedGetRecommendations.mockResolvedValue([])
    mockedPrisma.userJourney.findFirst.mockResolvedValue(null)
    mockedGetJourneyProgress.mockResolvedValue({ totalDays: 14, completedDays: 2, currentDayNumber: 3, percentComplete: 14, phases: [] })
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue({
      stateKey: 'active_journey',
      heading: 'God uge',
      body: 'Du er i gang.',
      ctaLabel: null,
      ctaUrl: null,
    })
    mockedPrisma.userProfile.findUnique.mockResolvedValue({ childAges: [2], primaryChallengeTagId: null })

    const result = await getDashboardState('user1')

    expect(result).toHaveProperty('stateKey')
    expect(result).toHaveProperty('checkInPrompt')
    expect(result).toHaveProperty('weeklyFocus')
    expect(result).toHaveProperty('personalizedWelcome')
    expect(result).toHaveProperty('activeJourney')
    expect(result).toHaveProperty('journeyProgress')
    expect(typeof result.checkInPrompt).toBe('string')
    expect(result.weeklyFocus).not.toBeNull()
    expect(result.personalizedWelcome).toHaveProperty('heading')
  })

  it('returns null weeklyFocus when no active journey', async () => {
    mockedGetUserActiveJourneyFn.mockResolvedValue(null)
    mockedGetUserInProgressCourses.mockResolvedValue([])
    mockedGetRecommendations.mockResolvedValue([])
    mockedPrisma.userJourney.findFirst.mockResolvedValue(null)
    mockedPrisma.dashboardMessage.findUnique.mockResolvedValue(null)
    mockedPrisma.userProfile.findUnique.mockResolvedValue(null)

    const result = await getDashboardState('user1')
    expect(result.weeklyFocus).toBeNull()
  })
})
