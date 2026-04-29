import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

/**
 * Find or create a Stripe Customer for the given user.
 *
 * Idempotent: if `User.stripeCustomerId` is already set, that customer is
 * returned (verified to still exist on Stripe). Otherwise a new Customer
 * is created and the id is persisted.
 *
 * Connect-aware: when `stripeAccountId` is provided, the Customer lives
 * on the connected account, not the platform. The same User may end up
 * with multiple Customer ids across different Connect accounts; until we
 * have a (userId, orgId) join table this helper short-circuits to the
 * stored `User.stripeCustomerId` regardless of account, which is correct
 * for the current single-tenant setup but will need a refactor when
 * multi-tenant Connect goes live.
 */
export async function findOrCreateStripeCustomer(
  userId: string,
  opts: { stripeAccountId?: string } = {}
): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  })

  const stripe = getStripe()
  const requestOpts: Stripe.RequestOptions | undefined = opts.stripeAccountId
    ? { stripeAccount: opts.stripeAccountId }
    : undefined

  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(
        user.stripeCustomerId,
        requestOpts
      )
      if (!existing.deleted) {
        return user.stripeCustomerId
      }
      // Customer was deleted on Stripe — fall through and create fresh.
    } catch {
      // Customer not found on this account (likely a Connect mismatch or
      // manual deletion). Fall through and create fresh.
    }
  }

  const created = await stripe.customers.create(
    {
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    },
    requestOpts
  )

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: created.id },
  })

  return created.id
}

/**
 * Look up the Stripe Customer id for a user without creating one. Returns
 * null if no customer has been associated yet — callers should use
 * `findOrCreateStripeCustomer` if they need one.
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })
  return user?.stripeCustomerId ?? null
}
