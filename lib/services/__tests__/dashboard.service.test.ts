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
import { getCheckInPrompt, getPersonalizedWelcome } from '../dashboard.service'

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
      childAges: [24],
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
      childAges: [8],
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
