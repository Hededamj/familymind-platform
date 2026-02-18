import Stripe from 'stripe'

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Please add it to your environment variables.'
    )
  }
  return new Stripe(key, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  })
}

// Lazy singleton: Stripe client is only instantiated on first access,
// allowing builds to succeed without credentials.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = getStripeClient()
  }
  return _stripe
}
