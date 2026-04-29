import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { pauseSubscription } from '@/lib/services/cancellation.service'
import type { RetentionOfferType } from '@prisma/client'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface EligibleOffer {
  id: string
  offerType: RetentionOfferType
  stripeCouponId: string | null
  durationMonths: number | null
  pauseMonths: number | null
  supportUrl: string | null
  supportMessage: string | null
  contentUrl: string | null
  contentMessage: string | null
  priority: number
}

export interface AcceptOfferInput {
  userId: string
  entitlementId: string
  surveyId: string
  offerId: string
}

export interface AcceptOfferResult {
  accepted: boolean       // true = newly accepted, false = already existed (idempotent)
  acceptanceId: string
  expiresAt: Date | null
  cancelReversed: boolean // true = cancel_at_period_end was reversed
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Resolve the Stripe Connect account ID for a user's organization.
 * Returns stripeAccountId only when the org has an active Connect account.
 * Mirrors checkout.service.ts pattern.
 */
async function resolveStripeAccountId(userId: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })
  if (!user?.organizationId) return undefined

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeAccountId: true, stripeAccountStatus: true },
  })
  if (org?.stripeAccountId && org.stripeAccountStatus === 'active') {
    return org.stripeAccountId
  }
  return undefined
}

/**
 * Check if a specific offer is eligible for a user.
 * Enforces: maxUsesPerUser, cooldownDays, and single-active-offer rule.
 */
async function isOfferEligible(offerId: string, userId: string): Promise<boolean> {
  // 1. Fetch the offer
  const offer = await prisma.retentionOffer.findUnique({ where: { id: offerId } })
  if (!offer || !offer.isActive) return false

  // 2. Count how many times this user has accepted this specific offer
  const acceptanceCount = await prisma.retentionOfferAcceptance.count({
    where: { offerId, userId },
  })
  if (acceptanceCount >= offer.maxUsesPerUser) return false

  // 3. Check cooldown: has the user accepted this offer within cooldownDays?
  if (offer.cooldownDays > 0 && acceptanceCount > 0) {
    const lastAcceptance = await prisma.retentionOfferAcceptance.findFirst({
      where: { offerId, userId },
      orderBy: { acceptedAt: 'desc' },
    })
    if (lastAcceptance) {
      const cooldownExpiry = new Date(lastAcceptance.acceptedAt)
      cooldownExpiry.setDate(cooldownExpiry.getDate() + offer.cooldownDays)
      if (new Date() < cooldownExpiry) return false
    }
  }

  // 4. Single-active-offer rule: check no other active offer acceptance exists for this user
  //    (NONE-type offers have expiresAt = null so they do not trigger this block)
  const activeAcceptance = await prisma.retentionOfferAcceptance.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  })
  if (activeAcceptance) return false

  return true
}

/**
 * Apply a Stripe discount coupon to an existing subscription.
 * Uses discounts array shape (not legacy top-level coupon string).
 * Passes Connect account context when tenant has an active Connect account.
 */
async function applyDiscountOffer(
  stripeSubscriptionId: string,
  stripeCouponId: string,
  stripeAccountId: string | undefined
): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.update(
    stripeSubscriptionId,
    { discounts: [{ coupon: stripeCouponId }] } as Parameters<typeof stripe.subscriptions.update>[1],
    {
      ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}),
      idempotencyKey: `discount-apply:${stripeSubscriptionId}:${stripeCouponId}`,
    }
  )
}

/**
 * Apply a pause offer by delegating to cancellation.service.pauseSubscription.
 * Returns the resumesAt date (used as expiresAt on the acceptance record).
 * Does NOT create the acceptance row — acceptOffer() does that centrally.
 */
async function applyPauseOffer(
  userId: string,
  entitlementId: string,
  months: 1 | 2 | 3,
  // surveyId and offerId retained for interface compatibility; not passed to pauseSubscription
  _surveyId: string,
  _offerId: string
): Promise<Date> {
  const result = await pauseSubscription({ userId, entitlementId, months })
  return result.resumesAt
}

/**
 * Reverse cancel_at_period_end on an existing subscription.
 * Called when a user accepts a retention offer while the subscription was
 * scheduled for cancellation at period end.
 */
async function reverseCancelAtPeriodEnd(
  stripeSubscriptionId: string,
  stripeAccountId: string | undefined
): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.update(
    stripeSubscriptionId,
    { cancel_at_period_end: false } as Parameters<typeof stripe.subscriptions.update>[1],
    {
      ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}),
      idempotencyKey: `reverse-cancel:${stripeSubscriptionId}`,
    }
  )
}

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Find the highest-priority retention offer eligible for the given user
 * based on their cancellation reason slugs.
 *
 * Returns null if:
 * - reasonSlugs is empty
 * - no CancellationReason rows match the slugs
 * - no active offers are triggered by those reasons
 * - all matching offers fail eligibility checks
 *
 * NOTE: No organizationId filter applied here — platform-wide offers (organizationId = null)
 * are visible to all users. Multi-tenant scoping deferred to Phase 13.
 */
export async function resolveEligibleOffer(
  userId: string,
  reasonSlugs: string[]
): Promise<EligibleOffer | null> {
  if (!reasonSlugs.length) return null

  // 1. Find all CancellationReason IDs matching the provided slugs
  const reasons = await prisma.cancellationReason.findMany({
    where: { slug: { in: reasonSlugs } },
    select: { id: true },
  })
  const reasonIds = reasons.map((r) => r.id)
  if (!reasonIds.length) return null

  // 2. Find all active offers triggered by any of these reasons, ordered by priority DESC
  const candidates = await prisma.retentionOffer.findMany({
    where: {
      isActive: true,
      triggers: {
        some: {
          cancellationReasonId: { in: reasonIds },
        },
      },
    },
    orderBy: { priority: 'desc' },
  })

  // 3. Walk candidates in priority order, return first eligible one
  for (const candidate of candidates) {
    const eligible = await isOfferEligible(candidate.id, userId)
    if (eligible) {
      return {
        id: candidate.id,
        offerType: candidate.offerType,
        stripeCouponId: candidate.stripeCouponId,
        durationMonths: candidate.durationMonths,
        pauseMonths: candidate.pauseMonths,
        supportUrl: candidate.supportUrl,
        supportMessage: candidate.supportMessage,
        contentUrl: candidate.contentUrl,
        contentMessage: candidate.contentMessage,
        priority: candidate.priority,
      }
    }
  }

  return null
}

/**
 * Accept a retention offer for a user.
 *
 * Idempotent: if an acceptance already exists for the given surveyId,
 * returns { accepted: false, ... } without any Stripe side-effects.
 *
 * Handles offer types:
 * - DISCOUNT: applies Stripe coupon via discounts array, computes expiresAt locally
 * - PAUSE: delegates to pauseSubscription(), uses resumesAt as expiresAt
 * - SUPPORT / CONTENT_HELP / NONE: no Stripe call for the offer itself
 *
 * For all non-PAUSE offers: auto-reverses cancel_at_period_end if it was true.
 */
export async function acceptOffer(input: AcceptOfferInput): Promise<AcceptOfferResult> {
  const { userId, entitlementId, surveyId, offerId } = input

  // OFF-ENGINE-06: Idempotency — check for existing acceptance with this surveyId
  const existing = await prisma.retentionOfferAcceptance.findUnique({
    where: { surveyId },
  })
  if (existing) {
    return {
      accepted: false,
      acceptanceId: existing.id,
      expiresAt: existing.expiresAt,
      cancelReversed: false,
    }
  }

  // IDOR guard: verify entitlement belongs to user and is ACTIVE
  const entitlement = await prisma.entitlement.findFirst({
    where: { id: entitlementId, userId, status: 'ACTIVE' },
  })
  if (!entitlement?.stripeSubscriptionId) {
    throw new Error('Intet aktivt abonnement fundet')
  }

  // Fetch the offer (throws if not found)
  const offer = await prisma.retentionOffer.findUniqueOrThrow({
    where: { id: offerId },
  })

  // Resolve Stripe Connect account for this user's org
  const stripeAccountId = await resolveStripeAccountId(userId)

  let expiresAt: Date | null = null
  let cancelReversed = false

  if (offer.offerType === 'DISCOUNT') {
    if (!offer.stripeCouponId) {
      throw new Error('Tilbud mangler Stripe coupon ID')
    }
    await applyDiscountOffer(
      entitlement.stripeSubscriptionId,
      offer.stripeCouponId,
      stripeAccountId
    )
    // Compute expiresAt locally — do NOT read from Stripe
    if (offer.durationMonths) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + offer.durationMonths)
    }
  }

  if (offer.offerType === 'PAUSE') {
    const months = (offer.pauseMonths ?? 1) as 1 | 2 | 3
    // applyPauseOffer calls pauseSubscription() which makes the Stripe call
    // resumesAt becomes the expiresAt on the acceptance record
    expiresAt = await applyPauseOffer(userId, entitlementId, months, surveyId, offerId)
  }

  // OFF-ENGINE-05: Auto-reverse cancel_at_period_end for all non-PAUSE offer types
  // (PAUSE handles its own Stripe state via pause_collection)
  if (offer.offerType !== 'PAUSE') {
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(
      entitlement.stripeSubscriptionId,
      {},
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    )
    const subData = sub as unknown as { cancel_at_period_end: boolean }
    if (subData.cancel_at_period_end) {
      await reverseCancelAtPeriodEnd(entitlement.stripeSubscriptionId, stripeAccountId)
      cancelReversed = true
    }
  }

  // Record acceptance
  const acceptance = await prisma.retentionOfferAcceptance.create({
    data: {
      offerId,
      surveyId,
      userId,
      offerType: offer.offerType,
      expiresAt,
    },
  })

  return {
    accepted: true,
    acceptanceId: acceptance.id,
    expiresAt,
    cancelReversed,
  }
}
