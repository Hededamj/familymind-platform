import type Stripe from 'stripe'

import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

/**
 * Gener\u00E9r Stripe Connect OAuth URL.
 * @param state - CSRF-token (gemmes i cookie af calleren)
 */
export function generateConnectOAuthUrl(state: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (!clientId) {
    throw new Error('STRIPE_CONNECT_CLIENT_ID is not set')
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe-connect/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state,
  })

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`
}

/**
 * H\u00E5ndt\u00E9r OAuth callback \u2014 exchange code for account ID.
 * Returnerer den opdaterede Organization.
 */
export async function handleConnectCallback(
  organizationId: string,
  code: string
) {
  const stripe = getStripe()

  // Exchange authorization code for account credentials
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  })

  const stripeAccountId = response.stripe_user_id
  if (!stripeAccountId) {
    throw new Error('Stripe OAuth returnerede intet account ID')
  }

  // Tjek at kontoen ikke allerede er forbundet til en anden organisation
  const existing = await prisma.organization.findFirst({
    where: { stripeAccountId, id: { not: organizationId } },
  })
  if (existing) {
    throw new Error('Denne Stripe-konto er allerede forbundet til en anden organisation')
  }

  // Hent account-status fra Stripe
  const account = await stripe.accounts.retrieve(stripeAccountId)
  const status = resolveAccountStatus(account)

  // Gem p\u00E5 Organization
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeAccountId,
      stripeAccountStatus: status,
      stripeOnboardedAt: status === 'active' ? new Date() : null,
    },
  })

  return org
}

/**
 * Frakobl Stripe-konto fra Organization.
 */
export async function disconnectStripeAccount(organizationId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  })

  if (!org.stripeAccountId) {
    throw new Error('Ingen Stripe-konto forbundet')
  }

  const stripe = getStripe()
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (!clientId) {
    throw new Error('STRIPE_CONNECT_CLIENT_ID is not set')
  }

  // Deauthorize hos Stripe — only reset DB on success
  try {
    await stripe.oauth.deauthorize({
      client_id: clientId,
      stripe_user_id: org.stripeAccountId,
    })
  } catch (err) {
    console.error('Stripe deauthorize fejl:', err)
    throw new Error('Kunne ikke frakoble hos Stripe — prøv igen')
  }

  // Nulstil Organization-felter
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeAccountId: null,
      stripeAccountStatus: 'not_connected',
      stripeOnboardedAt: null,
    },
  })
}

/**
 * Opdat\u00E9r Organization-status baseret p\u00E5 Stripe account data.
 * Kaldes fra webhook `account.updated`.
 */
export async function syncAccountStatus(stripeAccountId: string) {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(stripeAccountId)
  const status = resolveAccountStatus(account)

  // Always update status
  await prisma.organization.updateMany({
    where: { stripeAccountId },
    data: { stripeAccountStatus: status },
  })

  // Set stripeOnboardedAt only on first activation (when it's null)
  if (status === 'active') {
    await prisma.organization.updateMany({
      where: { stripeAccountId, stripeOnboardedAt: null },
      data: { stripeOnboardedAt: new Date() },
    })
  }
}

/**
 * Hent Organization's stripeAccountId og valid\u00E9r den er aktiv.
 * Bruges af checkout-flowet.
 */
export async function getActiveStripeAccount(
  organizationId: string
): Promise<string> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  })

  if (!org.stripeAccountId || org.stripeAccountStatus !== 'active') {
    throw new Error('Stripe er ikke forbundet eller aktiv for denne organisation')
  }

  return org.stripeAccountId
}

/**
 * Resolve the Stripe Connect account id to use for a given user, or
 * undefined if the user belongs to an org without an active Connect
 * account (platform-account fallback). Use this when wiring the
 * `stripeAccount` request option on Stripe API calls so the call
 * targets the right account whether Connect is in play or not.
 */
export async function getStripeAccountForUser(
  userId: string
): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })
  if (!user?.organizationId) return undefined

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeAccountId: true, stripeAccountStatus: true },
  })

  return org?.stripeAccountId && org.stripeAccountStatus === 'active'
    ? org.stripeAccountId
    : undefined
}

/**
 * Resolve Stripe account status fra account-objekt.
 */
function resolveAccountStatus(account: Stripe.Account): string {
  if (account.charges_enabled && account.payouts_enabled) return 'active'
  if (account.charges_enabled && !account.payouts_enabled) return 'restricted'
  return 'pending'
}
