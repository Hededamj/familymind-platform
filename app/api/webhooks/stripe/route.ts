import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import {
  createEntitlement,
  updateEntitlementStatus,
} from '@/lib/services/entitlement.service'

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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  let event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle webhook events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const productId = session.metadata?.productId

      if (!userId || !productId) break

      // Log connected account for debugging
      if (event.account) {
        console.log(`Checkout from connected account: ${event.account}`)
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { bundleItems: true },
      })
      if (!product) break

      // Idempotency: check if this checkout session was already processed
      const existingEntitlement = await prisma.entitlement.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      })
      if (existingEntitlement) break // Already processed

      if (product.type === 'SUBSCRIPTION') {
        await createEntitlement({
          userId,
          productId,
          source: 'SUBSCRIPTION',
          stripeSubscriptionId: session.subscription as string,
          stripeCheckoutSessionId: session.id,
        })
      } else if (product.type === 'BUNDLE') {
        // Atomic: create bundle + included product entitlements in one transaction
        await prisma.$transaction(async (tx) => {
          await createEntitlement({
            userId,
            productId,
            source: 'PURCHASE',
            stripeCheckoutSessionId: session.id,
          }, tx)
          for (const item of product.bundleItems) {
            await createEntitlement({
              userId,
              productId: item.includedProductId,
              source: 'PURCHASE',
            }, tx)
          }
        })
      } else {
        // For COURSE and SINGLE
        await createEntitlement({
          userId,
          productId,
          source: 'PURCHASE',
          stripeCheckoutSessionId: session.id,
        })
      }

      // Increment discount code usage if applicable
      if (session.total_details?.breakdown?.discounts?.length) {
        // Discount was applied — we'd need to track which code was used
        // For now, this will be handled when we enhance the discount system
      }

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      if (subscription.status === 'active') {
        await updateEntitlementStatus(subscription.id, 'ACTIVE')
      } else if (subscription.status === 'past_due') {
        // Keep active for now, but could flag
        console.log(`Subscription ${subscription.id} is past due`)
      } else if (
        subscription.status === 'canceled' ||
        subscription.status === 'unpaid'
      ) {
        await updateEntitlementStatus(subscription.id, 'CANCELLED')
      }

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await updateEntitlementStatus(subscription.id, 'CANCELLED')
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionRef =
        invoice.parent?.subscription_details?.subscription ?? null
      console.error(
        `Payment failed for invoice ${invoice.id}, subscription: ${subscriptionRef}`
      )
      // Don't immediately revoke — Stripe will retry. Log for monitoring.
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.id) {
        // Only sync accounts we know about — avoid API calls for unknown accounts
        const knownOrg = await prisma.organization.findFirst({
          where: { stripeAccountId: account.id },
          select: { id: true },
        })
        if (knownOrg) {
          const { syncAccountStatus } = await import(
            '@/lib/services/stripe-connect.service'
          )
          await syncAccountStatus(account.id)
        }
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
