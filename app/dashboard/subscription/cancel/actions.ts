'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelSubscription } from '@/lib/services/cancellation.service'
import { resolveEligibleOffer, acceptOffer, type EligibleOffer } from '@/lib/services/retention.service'
import type { RetentionOfferType } from '@prisma/client'

/**
 * Step 1 of the cancel flow: persist the survey and resolve the best retention offer.
 *
 * Upserts so the user can revisit the survey step without creating duplicate rows.
 * Tags are replaced atomically (deleteMany + create) on update.
 */
export async function submitSurveyAndResolveOffer(input: {
  entitlementId: string
  reasonSlugs: string[]
  feedback: string | null
  primaryReasonSlug: string
}): Promise<{
  surveyId: string
  offerType: RetentionOfferType | null
  offerId: string | null
  offerConfig: EligibleOffer | null
}> {
  const user = await requireAuth()

  // IDOR: verify the entitlement is active and belongs to this user
  const entitlement = await prisma.entitlement.findFirst({
    where: { id: input.entitlementId, userId: user.id, status: 'ACTIVE' },
  })
  if (!entitlement) {
    throw new Error('Intet aktivt abonnement fundet')
  }

  // Resolve the primary reason row
  const primary = await prisma.cancellationReason.findUnique({
    where: { slug: input.primaryReasonSlug },
  })
  if (!primary) {
    throw new Error('Ukendt årsag: ' + input.primaryReasonSlug)
  }

  // Resolve all tag reason IDs (superset of reasonSlugs)
  const tagReasons = await prisma.cancellationReason.findMany({
    where: { slug: { in: input.reasonSlugs } },
    select: { id: true },
  })
  const tagIds = tagReasons.map((r) => r.id)

  // Upsert the survey. On update, replace tags atomically.
  const survey = await prisma.cancellationSurvey.upsert({
    where: { userId_entitlementId: { userId: user.id, entitlementId: input.entitlementId } },
    update: {
      primaryReasonId: primary.id,
      feedback: input.feedback ?? null,
      tags: {
        deleteMany: {},
        create: tagIds.map((id) => ({ reasonId: id })),
      },
    },
    create: {
      userId: user.id,
      entitlementId: input.entitlementId,
      primaryReasonId: primary.id,
      feedback: input.feedback ?? null,
      tags: {
        create: tagIds.map((id) => ({ reasonId: id })),
      },
    },
  })

  const offer = await resolveEligibleOffer(user.id, input.reasonSlugs)

  return {
    surveyId: survey.id,
    offerType: offer?.offerType ?? null,
    offerId: offer?.id ?? null,
    offerConfig: offer,
  }
}

/**
 * Step 2 of the cancel flow (optional): accept a retention offer.
 *
 * If the offer is of type PAUSE and the user selected a custom pauseMonths,
 * we patch the offer row before delegating to acceptOffer().
 *
 * TODO(phase-13): plumb pauseMonths through acceptOffer input instead of mutating offer row.
 */
export async function acceptOfferAction(input: {
  surveyId: string
  offerId: string
  entitlementId: string
  pauseMonths?: 1 | 2 | 3
}): Promise<{
  acceptanceId: string
  expiresAt: Date | null
  cancelReversed: boolean
}> {
  const user = await requireAuth()

  if (input.pauseMonths !== undefined) {
    // Fetch the offer to check type before mutating
    const offer = await prisma.retentionOffer.findUnique({
      where: { id: input.offerId },
      select: { offerType: true, pauseMonths: true },
    })
    if (offer?.offerType === 'PAUSE' && offer.pauseMonths !== input.pauseMonths) {
      // TODO(phase-13): plumb pauseMonths through acceptOffer input instead of mutating offer row
      await prisma.retentionOffer.update({
        where: { id: input.offerId },
        data: { pauseMonths: input.pauseMonths },
      })
    }
  }

  const result = await acceptOffer({
    userId: user.id,
    entitlementId: input.entitlementId,
    surveyId: input.surveyId,
    offerId: input.offerId,
  })

  return {
    acceptanceId: result.acceptanceId,
    expiresAt: result.expiresAt,
    cancelReversed: result.cancelReversed,
  }
}

/**
 * Step 3 of the cancel flow: confirm cancellation.
 *
 * Survey-gate workaround (OFF-DATA-03): cancelSubscription() throws if no CancellationSurvey
 * row exists. We upsert a minimal row first so the skip-path (user went straight to
 * "confirm cancel" without completing the survey) satisfies the gate.
 *
 * The upsert update block is intentionally empty — if the user did complete the survey in
 * Step 1, all fields (primaryReasonId, feedback, tags) are preserved untouched.
 */
export async function confirmCancelAction(input: {
  entitlementId: string
}): Promise<{
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date
}> {
  const user = await requireAuth()

  // Survey-gate workaround: ensure a survey row exists before calling cancelSubscription
  await prisma.cancellationSurvey.upsert({
    where: { userId_entitlementId: { userId: user.id, entitlementId: input.entitlementId } },
    update: {},
    create: { userId: user.id, entitlementId: input.entitlementId },
  })

  const result = await cancelSubscription({ userId: user.id, entitlementId: input.entitlementId })

  return {
    cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    currentPeriodEnd: result.currentPeriodEnd,
  }
}
