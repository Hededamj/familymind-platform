/**
 * Send a signed Stripe webhook event to a local dev server (or any URL)
 * to validate the handler end-to-end without going through Stripe.
 *
 * Computes the v1 signature with STRIPE_WEBHOOK_SECRET so the route's
 * `constructEvent` accepts it as authentic. The event payloads are
 * synthetic but shape-compatible with real Stripe events.
 *
 * Usage:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/test-stripe-webhook.ts <event> [url]
 *
 *   <event> = past_due | paused | refunded | trial_ending | deauth
 *   [url]   = http://localhost:3000/api/webhooks/stripe (default)
 */

import crypto from 'node:crypto'

type EventBuilder = () => { type: string; data: { object: unknown }; account?: string }

const SUB_ID = process.env.TEST_STRIPE_SUB_ID ?? 'sub_test_synthetic'
const ACCOUNT_ID = process.env.TEST_STRIPE_ACCOUNT_ID ?? 'acct_test_synthetic'

const builders: Record<string, EventBuilder> = {
  past_due: () => ({
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: SUB_ID,
        object: 'subscription',
        status: 'past_due',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
        cancel_at_period_end: false,
        pause_collection: null,
      },
    },
  }),
  paused: () => ({
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: SUB_ID,
        object: 'subscription',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
        cancel_at_period_end: false,
        pause_collection: {
          behavior: 'void',
          resumes_at: Math.floor(Date.now() / 1000) + 60 * 86400,
        },
      },
    },
  }),
  refunded: () => ({
    type: 'charge.refunded',
    data: {
      object: {
        id: 'ch_test_synthetic',
        object: 'charge',
        amount: 14900,
        amount_refunded: 14900,
        payment_intent: 'pi_test_synthetic',
      },
    },
  }),
  trial_ending: () => ({
    type: 'customer.subscription.trial_will_end',
    data: {
      object: {
        id: SUB_ID,
        object: 'subscription',
        status: 'trialing',
        trial_end: Math.floor(Date.now() / 1000) + 3 * 86400,
      },
    },
  }),
  deauth: () => ({
    type: 'account.application.deauthorized',
    data: { object: { id: 'ca_test_application' } },
    account: ACCOUNT_ID,
  }),
}

function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}

async function main() {
  const eventName = process.argv[2]
  const url = process.argv[3] ?? 'http://localhost:3000/api/webhooks/stripe'

  if (!eventName || !builders[eventName]) {
    console.error(`Usage: ... <event> [url]`)
    console.error(`Available: ${Object.keys(builders).join(', ')}`)
    process.exit(1)
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    process.exit(1)
  }

  const built = builders[eventName]()
  const event = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2026-01-28.clover',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    ...built,
  }

  const payload = JSON.stringify(event)
  const signature = signPayload(payload, secret)

  console.log(`POST ${url}`)
  console.log(`Event: ${event.type} (id=${event.id})`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  })

  const text = await res.text()
  console.log(`Status: ${res.status}`)
  console.log(`Body: ${text}`)
  process.exit(res.ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
