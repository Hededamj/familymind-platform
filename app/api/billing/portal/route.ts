import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { findOrCreateStripeCustomer } from '@/lib/services/stripe-customer.service'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  // Resolve the user's Stripe Customer. Use the cached one on User.stripe-
  // CustomerId; fall back to deriving from an active subscription for users
  // who pre-date the customer-reuse refactor and haven't been backfilled.
  let customerId: string | null = user.stripeCustomerId

  // Resolve Connect account if the user belongs to an org with one wired up.
  let stripeAccountId: string | undefined
  if (user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    })
    if (org?.stripeAccountId && org.stripeAccountStatus === 'active') {
      stripeAccountId = org.stripeAccountId
    }
  }

  const requestOpts: Stripe.RequestOptions | undefined = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined

  const stripe = getStripe()

  if (!customerId) {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        stripeSubscriptionId: { not: null },
      },
      select: { stripeSubscriptionId: true },
    })

    if (entitlement?.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          entitlement.stripeSubscriptionId,
          requestOpts
        )
        customerId = subscription.customer as string
        // Persist for future calls (skip if Connect-scoped — multi-tenant
        // join table will handle that case later).
        if (!stripeAccountId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId },
          })
        }
      } catch {
        // fall through — we'll create one below
      }
    }
  }

  if (!customerId) {
    // No subscription, no cached id. Spin up a fresh Customer so the user
    // can still reach the billing portal (it will simply be empty).
    customerId = await findOrCreateStripeCustomer(user.id, { stripeAccountId })
  }

  try {
    const session = await stripe.billingPortal.sessions.create(
      {
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
      requestOpts
    )

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json(
      { error: 'Kunne ikke oprette forbindelse til betalingssystemet. Kontakt support.' },
      { status: 502 }
    )
  }
}
