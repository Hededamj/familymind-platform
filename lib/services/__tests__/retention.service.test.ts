import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    retentionOffer: { findMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    retentionOfferAcceptance: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    cancellationReason: { findMany: vi.fn() },
    entitlement: { findFirst: vi.fn() },
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
  })),
}))

// Mock the pauseSubscription re-export so test J does not hit the real Stripe layer
vi.mock('@/lib/services/cancellation.service', () => ({
  pauseSubscription: vi.fn(),
}))

import { resolveEligibleOffer, acceptOffer } from '@/lib/services/retention.service'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { pauseSubscription } from '@/lib/services/cancellation.service'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deep-mock helper; Prisma's recursive type is impractical to reconstruct
const mockedPrisma = prisma as any
const mockedPauseSubscription = pauseSubscription as ReturnType<typeof vi.fn>

// Helper to get stripe mock instance
function getStripeMock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (getStripe as any)() as {
    subscriptions: {
      retrieve: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
    }
  }
}

// Shared test data builders
function makeOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'offer-1',
    offerType: 'DISCOUNT',
    isActive: true,
    priority: 10,
    stripeCouponId: 'cpn_x',
    durationMonths: 3,
    pauseMonths: null,
    maxUsesPerUser: 1,
    cooldownDays: 365,
    supportUrl: null,
    supportMessage: null,
    contentUrl: null,
    contentMessage: null,
    organizationId: null,
    triggers: [],
    ...overrides,
  }
}

function makeEntitlement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ent-1',
    userId: 'user-1',
    stripeSubscriptionId: 'sub_abc123',
    status: 'ACTIVE',
    organizationId: 'org-1',
    ...overrides,
  }
}

function makeOrg(overrides: Record<string, unknown> = {}) {
  return {
    id: 'org-1',
    stripeAccountId: 'acct_123',
    stripeAccountStatus: 'active',
    ...overrides,
  }
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    ...overrides,
  }
}

// ─── resolveEligibleOffer tests ────────────────────────────────────────────────

describe('resolveEligibleOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test A: returns null when reasonSlugs empty
  it('A: returns null when reasonSlugs is empty', async () => {
    const result = await resolveEligibleOffer('user-1', [])
    expect(result).toBeNull()
  })

  // Test B: returns null when no matching reason slugs in DB
  it('B: returns null when no CancellationReason rows match the given slugs', async () => {
    mockedPrisma.cancellationReason.findMany.mockResolvedValue([])

    const result = await resolveEligibleOffer('user-1', ['unknown-slug'])
    expect(result).toBeNull()
  })

  // Test C: returns highest-priority offer when multiple candidates match (priority desc)
  it('C: returns highest-priority eligible offer when multiple candidates match', async () => {
    mockedPrisma.cancellationReason.findMany.mockResolvedValue([{ id: 'reason-1' }])

    const highPriority = makeOffer({ id: 'offer-high', priority: 20 })
    const lowPriority = makeOffer({ id: 'offer-low', priority: 5 })

    mockedPrisma.retentionOffer.findMany.mockResolvedValue([highPriority, lowPriority])

    // isOfferEligible calls: findUnique(offer), count(acceptances), findFirst(active-acceptance)
    // For highPriority offer: all checks pass → return it
    mockedPrisma.retentionOffer.findUnique.mockResolvedValue(highPriority)
    mockedPrisma.retentionOfferAcceptance.count.mockResolvedValue(0)
    mockedPrisma.retentionOfferAcceptance.findFirst.mockResolvedValue(null)

    const result = await resolveEligibleOffer('user-1', ['pris'])
    expect(result).not.toBeNull()
    expect(result?.id).toBe('offer-high')
  })

  // Test D: skips offer when acceptanceCount >= maxUsesPerUser and returns next candidate
  it('D: skips offer when acceptanceCount >= maxUsesPerUser and returns next eligible candidate', async () => {
    mockedPrisma.cancellationReason.findMany.mockResolvedValue([{ id: 'reason-1' }])

    const offerA = makeOffer({ id: 'offer-a', priority: 20, maxUsesPerUser: 1 })
    const offerB = makeOffer({ id: 'offer-b', priority: 10, maxUsesPerUser: 1 })

    mockedPrisma.retentionOffer.findMany.mockResolvedValue([offerA, offerB])

    // isOfferEligible for offerA: count >= maxUsesPerUser → skip
    // isOfferEligible for offerB: count = 0 → eligible
    mockedPrisma.retentionOffer.findUnique
      .mockResolvedValueOnce(offerA) // first call for offerA
      .mockResolvedValueOnce(offerB) // second call for offerB

    mockedPrisma.retentionOfferAcceptance.count
      .mockResolvedValueOnce(1) // offerA: 1 >= maxUsesPerUser(1) → skip
      .mockResolvedValueOnce(0) // offerB: 0 < maxUsesPerUser(1) → proceed

    mockedPrisma.retentionOfferAcceptance.findFirst.mockResolvedValue(null)

    const result = await resolveEligibleOffer('user-1', ['pris'])
    expect(result).not.toBeNull()
    expect(result?.id).toBe('offer-b')
  })

  // Test E: skips offer when user has active (non-expired) acceptance (single-active-offer rule)
  it('E: skips offer when user already has an active non-expired acceptance', async () => {
    mockedPrisma.cancellationReason.findMany.mockResolvedValue([{ id: 'reason-1' }])

    const offer = makeOffer({ id: 'offer-1', priority: 10 })
    mockedPrisma.retentionOffer.findMany.mockResolvedValue([offer])

    mockedPrisma.retentionOffer.findUnique.mockResolvedValue(offer)
    mockedPrisma.retentionOfferAcceptance.count.mockResolvedValue(0)
    // Active acceptance exists → single-active-offer rule fires
    mockedPrisma.retentionOfferAcceptance.findFirst.mockResolvedValue({
      id: 'acceptance-existing',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
    })

    const result = await resolveEligibleOffer('user-1', ['pris'])
    expect(result).toBeNull()
  })
})

// ─── acceptOffer tests ─────────────────────────────────────────────────────────

describe('acceptOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset getStripe mock to return fresh mock object each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(getStripe as any).mockReturnValue({
      subscriptions: {
        retrieve: vi.fn(),
        update: vi.fn(),
      },
    })
  })

  // Test F: idempotency — existing acceptance returns { accepted:false } WITHOUT calling Stripe
  it('F: returns { accepted: false } for existing surveyId without calling stripe.subscriptions.update', async () => {
    mockedPrisma.retentionOfferAcceptance.findUnique.mockResolvedValue({
      id: 'acceptance-existing',
      surveyId: 'survey-1',
      expiresAt: new Date('2026-07-06'),
    })

    const stripe = getStripeMock()

    const result = await acceptOffer({
      userId: 'user-1',
      entitlementId: 'ent-1',
      surveyId: 'survey-1',
      offerId: 'offer-1',
    })

    expect(result.accepted).toBe(false)
    expect(result.acceptanceId).toBe('acceptance-existing')
    expect(stripe.subscriptions.update).toHaveBeenCalledTimes(0)
  })

  // Test G: DISCOUNT calls stripe.subscriptions.update with discounts:[{coupon}] array shape and Connect context
  it('G: acceptOffer DISCOUNT calls stripe.subscriptions.update with discounts:[{coupon:"cpn_x"}] and {stripeAccount:"acct_123"}', async () => {
    mockedPrisma.retentionOfferAcceptance.findUnique.mockResolvedValue(null) // no existing
    mockedPrisma.entitlement.findFirst.mockResolvedValue(makeEntitlement())
    mockedPrisma.retentionOffer.findUniqueOrThrow.mockResolvedValue(
      makeOffer({ offerType: 'DISCOUNT', stripeCouponId: 'cpn_x', durationMonths: 3 })
    )
    mockedPrisma.user.findUnique.mockResolvedValue(makeUser())
    mockedPrisma.organization.findUnique.mockResolvedValue(makeOrg())

    const stripe = getStripeMock()
    stripe.subscriptions.retrieve.mockResolvedValue({ cancel_at_period_end: false })
    stripe.subscriptions.update.mockResolvedValue({})

    mockedPrisma.retentionOfferAcceptance.create.mockResolvedValue({
      id: 'acceptance-new',
      expiresAt: new Date('2026-07-06'),
    })

    await acceptOffer({
      userId: 'user-1',
      entitlementId: 'ent-1',
      surveyId: 'survey-1',
      offerId: 'offer-1',
    })

    expect(stripe.subscriptions.update).toHaveBeenCalledWith(
      'sub_abc123',
      { discounts: [{ coupon: 'cpn_x' }] },
      expect.objectContaining({
        stripeAccount: 'acct_123',
        idempotencyKey: 'discount-apply:sub_abc123:cpn_x',
      })
    )
  })

  // Test H: DISCOUNT computes expiresAt locally as now + durationMonths (NOT read from Stripe)
  it('H: acceptOffer DISCOUNT computes expiresAt locally as now + durationMonths months', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-06'))

    mockedPrisma.retentionOfferAcceptance.findUnique.mockResolvedValue(null)
    mockedPrisma.entitlement.findFirst.mockResolvedValue(makeEntitlement())
    mockedPrisma.retentionOffer.findUniqueOrThrow.mockResolvedValue(
      makeOffer({ offerType: 'DISCOUNT', stripeCouponId: 'cpn_x', durationMonths: 3 })
    )
    mockedPrisma.user.findUnique.mockResolvedValue(makeUser())
    mockedPrisma.organization.findUnique.mockResolvedValue(makeOrg())

    const stripe = getStripeMock()
    stripe.subscriptions.retrieve.mockResolvedValue({ cancel_at_period_end: false })
    stripe.subscriptions.update.mockResolvedValue({})

    let capturedExpiresAt: Date | null = null
    mockedPrisma.retentionOfferAcceptance.create.mockImplementation(
      async (args: { data: { expiresAt: Date | null } }) => {
        capturedExpiresAt = args.data.expiresAt
        return { id: 'acceptance-new', expiresAt: args.data.expiresAt }
      }
    )

    await acceptOffer({
      userId: 'user-1',
      entitlementId: 'ent-1',
      surveyId: 'survey-1',
      offerId: 'offer-1',
    })

    vi.useRealTimers()

    // expiresAt should be April 2026 + 3 months = July 2026
    expect(capturedExpiresAt).not.toBeNull()
    expect((capturedExpiresAt as unknown as Date).getMonth()).toBe(6) // July = month index 6
    expect((capturedExpiresAt as unknown as Date).getFullYear()).toBe(2026)
  })

  // Test I: auto-reverses cancel_at_period_end when true and offer is DISCOUNT → returns cancelReversed:true
  it('I: auto-reverses cancel_at_period_end:true for DISCOUNT offer and returns cancelReversed:true', async () => {
    mockedPrisma.retentionOfferAcceptance.findUnique.mockResolvedValue(null)
    mockedPrisma.entitlement.findFirst.mockResolvedValue(makeEntitlement())
    mockedPrisma.retentionOffer.findUniqueOrThrow.mockResolvedValue(
      makeOffer({ offerType: 'DISCOUNT', stripeCouponId: 'cpn_x', durationMonths: 3 })
    )
    mockedPrisma.user.findUnique.mockResolvedValue(makeUser())
    mockedPrisma.organization.findUnique.mockResolvedValue(makeOrg())

    const stripe = getStripeMock()
    // Subscription was scheduled for cancellation
    stripe.subscriptions.retrieve.mockResolvedValue({ cancel_at_period_end: true })
    stripe.subscriptions.update.mockResolvedValue({})

    mockedPrisma.retentionOfferAcceptance.create.mockResolvedValue({
      id: 'acceptance-new',
      expiresAt: new Date('2026-07-06'),
    })

    const result = await acceptOffer({
      userId: 'user-1',
      entitlementId: 'ent-1',
      surveyId: 'survey-1',
      offerId: 'offer-1',
    })

    expect(result.cancelReversed).toBe(true)

    // Verify that cancel_at_period_end:false was passed in one of the update calls
    const updateCalls = stripe.subscriptions.update.mock.calls
    const reversalCall = updateCalls.find(
      (call: unknown[]) =>
        (call[1] as Record<string, unknown>).cancel_at_period_end === false
    )
    expect(reversalCall).toBeDefined()
  })

  // Test J: PAUSE calls pauseSubscription with correct months and records acceptance; does NOT call cancel-reversal
  it('J: acceptOffer PAUSE calls pauseSubscription with correct months and does NOT call cancel-reversal branch', async () => {
    mockedPrisma.retentionOfferAcceptance.findUnique.mockResolvedValue(null)
    mockedPrisma.entitlement.findFirst.mockResolvedValue(makeEntitlement())
    mockedPrisma.retentionOffer.findUniqueOrThrow.mockResolvedValue(
      makeOffer({ offerType: 'PAUSE', pauseMonths: 2, stripeCouponId: null, durationMonths: null })
    )
    mockedPrisma.user.findUnique.mockResolvedValue(makeUser())
    mockedPrisma.organization.findUnique.mockResolvedValue(makeOrg())

    const resumesAt = new Date('2026-06-09')
    mockedPauseSubscription.mockResolvedValue({ resumesAt })

    mockedPrisma.retentionOfferAcceptance.create.mockResolvedValue({
      id: 'acceptance-new',
      expiresAt: resumesAt,
    })

    const stripe = getStripeMock()

    const result = await acceptOffer({
      userId: 'user-1',
      entitlementId: 'ent-1',
      surveyId: 'survey-1',
      offerId: 'offer-1',
    })

    // pauseSubscription should have been called with the right months
    expect(mockedPauseSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        entitlementId: 'ent-1',
        months: 2,
      })
    )

    // Stripe retrieve/update should NOT have been called (PAUSE skips cancel-reversal branch)
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled()
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()

    expect(result.accepted).toBe(true)
    expect(result.cancelReversed).toBe(false)
  })
})
