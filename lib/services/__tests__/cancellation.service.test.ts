import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStripe = {
  subscriptions: {
    retrieve: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cancellationSurvey: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    entitlement: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: () => mockStripe,
}))

import { cancelSubscription, pauseSubscription, listCancellations } from '../cancellation.service'
import { prisma } from '@/lib/prisma'

const mockedPrisma = prisma as any

describe('cancelSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test A: throws when no CancellationSurvey exists
  it('throws "Survey er ikke udfyldt" when no survey exists for (userId, entitlementId)', async () => {
    mockedPrisma.entitlement.findFirst.mockResolvedValue({
      id: 'ent-1',
      userId: 'user-1',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    })
    mockedPrisma.cancellationSurvey.findUnique.mockResolvedValue(null)

    await expect(
      cancelSubscription({ userId: 'user-1', entitlementId: 'ent-1' })
    ).rejects.toThrow('Survey er ikke udfyldt')
  })

  // Test B: throws when entitlement does not belong to userId (IDOR guard)
  it('throws when entitlement does not belong to the given userId', async () => {
    mockedPrisma.entitlement.findFirst.mockResolvedValue(null)

    await expect(
      cancelSubscription({ userId: 'attacker-user', entitlementId: 'ent-1' })
    ).rejects.toThrow()
  })

  // Test C: happy path — calls Stripe, updates survey.cancelledAt, returns result
  it('calls stripe.subscriptions.update with cancel_at_period_end:true and sets survey.cancelledAt', async () => {
    const periodEnd = Math.floor(new Date('2025-12-31').getTime() / 1000)

    mockedPrisma.entitlement.findFirst.mockResolvedValue({
      id: 'ent-1',
      userId: 'user-1',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    })
    mockedPrisma.cancellationSurvey.findUnique.mockResolvedValue({
      id: 'survey-1',
      userId: 'user-1',
      entitlementId: 'ent-1',
      cancelledAt: null,
    })
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      cancel_at_period_end: false,
      current_period_end: periodEnd,
      status: 'active',
    })
    mockStripe.subscriptions.update.mockResolvedValue({
      cancel_at_period_end: true,
      current_period_end: periodEnd,
      status: 'active',
    })
    mockedPrisma.cancellationSurvey.update.mockResolvedValue({})

    const result = await cancelSubscription({ userId: 'user-1', entitlementId: 'ent-1' })

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
      cancel_at_period_end: true,
    })
    expect(mockedPrisma.cancellationSurvey.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cancelledAt: expect.any(Date) }),
      })
    )
    expect(result.cancelAtPeriodEnd).toBe(true)
    expect(result.currentPeriodEnd).toBeInstanceOf(Date)
  })

  // Test D: idempotency — already cancelling, skip Stripe update
  it('does NOT call stripe.subscriptions.update when cancel_at_period_end is already true', async () => {
    const periodEnd = Math.floor(new Date('2025-12-31').getTime() / 1000)

    mockedPrisma.entitlement.findFirst.mockResolvedValue({
      id: 'ent-1',
      userId: 'user-1',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    })
    mockedPrisma.cancellationSurvey.findUnique.mockResolvedValue({
      id: 'survey-1',
      userId: 'user-1',
      entitlementId: 'ent-1',
      cancelledAt: null,
    })
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      cancel_at_period_end: true,
      current_period_end: periodEnd,
      status: 'active',
    })
    mockedPrisma.cancellationSurvey.update.mockResolvedValue({})

    const result = await cancelSubscription({ userId: 'user-1', entitlementId: 'ent-1' })

    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled()
    expect(result.cancelAtPeriodEnd).toBe(true)
    expect(result.currentPeriodEnd).toBeInstanceOf(Date)
  })
})

describe('pauseSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test E: months=2, calls Stripe with void behavior and Unix seconds resumes_at
  it('calls stripe.subscriptions.update with pause_collection.behavior=void and resumes_at as Unix seconds for months=2', async () => {
    mockedPrisma.entitlement.findFirst.mockResolvedValue({
      id: 'ent-1',
      userId: 'user-1',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    })
    mockStripe.subscriptions.update.mockResolvedValue({})
    mockedPrisma.cancellationSurvey.upsert.mockResolvedValue({})

    const before = Math.floor(Date.now() / 1000)
    const result = await pauseSubscription({ userId: 'user-1', entitlementId: 'ent-1', months: 2 })
    const after = Math.floor(Date.now() / 1000)

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
      'sub_test123',
      expect.objectContaining({
        pause_collection: expect.objectContaining({
          behavior: 'void',
        }),
      })
    )

    const callArgs = mockStripe.subscriptions.update.mock.calls[0][1]
    const resumesAtUnix = callArgs.pause_collection.resumes_at

    // resumes_at should be Unix seconds (not milliseconds)
    // 2 months in seconds is roughly 5000000-5500000 seconds from now
    const twoMonthsMin = before + 50 * 24 * 3600 // at least 50 days
    const twoMonthsMax = after + 70 * 24 * 3600  // at most 70 days
    expect(resumesAtUnix).toBeGreaterThan(twoMonthsMin)
    expect(resumesAtUnix).toBeLessThan(twoMonthsMax)
    // Must not be milliseconds — if it were ms, it would be 1000x larger
    expect(resumesAtUnix).toBeLessThan(after * 1000)

    expect(result.resumesAt).toBeInstanceOf(Date)
  })

  // Test F: updates CancellationSurvey.offeredPause=true and pauseAccepted=true
  it('upserts CancellationSurvey with offeredPause=true and pauseAccepted=true', async () => {
    mockedPrisma.entitlement.findFirst.mockResolvedValue({
      id: 'ent-1',
      userId: 'user-1',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    })
    mockStripe.subscriptions.update.mockResolvedValue({})
    mockedPrisma.cancellationSurvey.upsert.mockResolvedValue({})

    await pauseSubscription({ userId: 'user-1', entitlementId: 'ent-1', months: 1 })

    expect(mockedPrisma.cancellationSurvey.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ offeredPause: true, pauseAccepted: true }),
        create: expect.objectContaining({ offeredPause: true, pauseAccepted: true }),
      })
    )
  })

  // Test G: runtime guard rejects invalid months values (e.g. 4)
  it('throws for invalid months value (e.g. 4) as defence-in-depth runtime guard', async () => {
    mockedPrisma.entitlement.findFirst.mockResolvedValue({
      id: 'ent-1',
      userId: 'user-1',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    })

    await expect(
      // @ts-expect-error intentional: testing runtime guard for invalid input
      pauseSubscription({ userId: 'user-1', entitlementId: 'ent-1', months: 4 })
    ).rejects.toThrow()
  })
})

describe('listCancellations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test H: calls findMany with the correct include shape
  it('calls prisma.cancellationSurvey.findMany with include: user, entitlement, primaryReason, tags + reason', async () => {
    mockedPrisma.cancellationSurvey.findMany.mockResolvedValue([])

    await listCancellations()

    expect(mockedPrisma.cancellationSurvey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          user: true,
          entitlement: true,
          primaryReason: true,
          tags: expect.objectContaining({
            include: expect.objectContaining({ reason: true }),
          }),
        }),
      })
    )
  })

  // Test I: orders by submittedAt desc
  it('orders results by submittedAt desc', async () => {
    mockedPrisma.cancellationSurvey.findMany.mockResolvedValue([])

    await listCancellations()

    expect(mockedPrisma.cancellationSurvey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { submittedAt: 'desc' },
      })
    )
  })
})
