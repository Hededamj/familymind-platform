import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { pauseEntitlements } from '@/lib/services/entitlement.service'
import { getStripeAccountForUser } from '@/lib/services/stripe-connect.service'

export interface CancelSubscriptionInput {
  userId: string
  entitlementId: string
}

export interface CancelSubscriptionResult {
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date
}

export async function cancelSubscription(
  input: CancelSubscriptionInput
): Promise<CancelSubscriptionResult> {
  const { userId, entitlementId } = input

  // 1. IDOR guard: re-verify entitlement ownership server-side
  const entitlement = await prisma.entitlement.findFirst({
    where: { id: entitlementId, userId, status: 'ACTIVE' },
  })
  if (!entitlement?.stripeSubscriptionId) {
    throw new Error('Intet aktivt abonnement fundet')
  }

  // 2. Survey gate — OFF-DATA-03 requirement: must have submitted a survey first
  const survey = await prisma.cancellationSurvey.findUnique({
    where: { userId_entitlementId: { userId, entitlementId } },
  })
  if (!survey) {
    throw new Error('Survey er ikke udfyldt. Udfyld venligst begrundelse først.')
  }

  // 3. Idempotency: retrieve subscription from Stripe to check if already scheduled for cancel
  const stripe = getStripe()
  const stripeAccountId = await getStripeAccountForUser(userId)
  const requestOpts: Stripe.RequestOptions | undefined = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined
  const sub = await stripe.subscriptions.retrieve(
    entitlement.stripeSubscriptionId,
    requestOpts
  )
  const subData = sub as unknown as { cancel_at_period_end: boolean; current_period_end: number }
  const currentPeriodEnd = new Date(subData.current_period_end * 1000)

  if (subData.cancel_at_period_end) {
    // Already scheduled for cancel — ensure cancelledAt is set on survey, then return
    if (!survey.cancelledAt) {
      await prisma.cancellationSurvey.update({
        where: { id: survey.id },
        data: { cancelledAt: new Date() },
      })
    }
    return { cancelAtPeriodEnd: true, currentPeriodEnd }
  }

  // 4. Call Stripe to schedule cancel at period end. Idempotency key
  // ties the request to the entitlement so a double-click or retry
  // collapses to one Stripe-side operation.
  const updated = await stripe.subscriptions.update(
    entitlement.stripeSubscriptionId,
    { cancel_at_period_end: true },
    { ...requestOpts, idempotencyKey: `cancel:${entitlementId}` }
  )
  const updatedData = updated as unknown as { current_period_end: number }

  // 5. Mark survey as having triggered a cancel
  await prisma.cancellationSurvey.update({
    where: { id: survey.id },
    data: { cancelledAt: new Date() },
  })

  return {
    cancelAtPeriodEnd: true,
    currentPeriodEnd: new Date(updatedData.current_period_end * 1000),
  }
}

export interface PauseSubscriptionInput {
  userId: string
  entitlementId: string
  months: 1 | 2 | 3
}

export interface PauseSubscriptionResult {
  resumesAt: Date
}

export async function pauseSubscription(
  input: PauseSubscriptionInput
): Promise<PauseSubscriptionResult> {
  const { userId, entitlementId, months } = input

  // Defence-in-depth runtime guard (TypeScript enforces at compile time, this catches JS misuse)
  if (![1, 2, 3].includes(months)) {
    throw new Error('Pause varighed skal være 1, 2 eller 3 måneder')
  }

  // IDOR guard: re-verify entitlement ownership server-side
  const entitlement = await prisma.entitlement.findFirst({
    where: { id: entitlementId, userId, status: 'ACTIVE' },
  })
  if (!entitlement?.stripeSubscriptionId) {
    throw new Error('Intet aktivt abonnement fundet')
  }

  // Compute resume date as Unix seconds (not milliseconds)
  const resumesAt = new Date()
  resumesAt.setMonth(resumesAt.getMonth() + months)
  const resumesAtUnix = Math.floor(resumesAt.getTime() / 1000)

  // Call Stripe with pause_collection void behavior
  const stripe = getStripe()
  const stripeAccountId = await getStripeAccountForUser(userId)
  const requestOpts: Stripe.RequestOptions | undefined = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined
  await stripe.subscriptions.update(
    entitlement.stripeSubscriptionId,
    {
      pause_collection: {
        behavior: 'void',
        resumes_at: resumesAtUnix,
      },
    } as Parameters<typeof stripe.subscriptions.update>[1],
    { ...requestOpts, idempotencyKey: `pause:${entitlementId}:${months}` }
  )

  // Mirror the pause in our DB so the dashboard, analytics and gating
  // logic see status=PAUSED instead of relying on the now-irrelevant
  // ACTIVE flag. The webhook handler also picks up subscription.updated
  // events, but writing here keeps local state consistent without an
  // RTT to Stripe → us → webhook.
  await pauseEntitlements(entitlement.stripeSubscriptionId, resumesAt)

  // Upsert survey pause flags (survey may not exist yet if user pauses before submitting full survey)
  await prisma.cancellationSurvey.upsert({
    where: { userId_entitlementId: { userId, entitlementId } },
    update: { offeredPause: true, pauseAccepted: true },
    create: {
      userId,
      entitlementId,
      offeredPause: true,
      pauseAccepted: true,
    },
  })

  return { resumesAt }
}

export async function listCancellations() {
  return prisma.cancellationSurvey.findMany({
    include: {
      user: true,
      entitlement: true,
      primaryReason: true,
      tags: { include: { reason: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })
}
