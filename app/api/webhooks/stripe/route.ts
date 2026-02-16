import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle webhook events — to be implemented in Phase 1a (Task 1.12)
  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: Create entitlement
      break
    case 'customer.subscription.updated':
      // TODO: Update entitlement status
      break
    case 'customer.subscription.deleted':
      // TODO: Mark entitlement as cancelled
      break
    case 'invoice.payment_failed':
      // TODO: Flag for follow-up
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
