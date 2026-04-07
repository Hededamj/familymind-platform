import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
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
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const priceVariantId = session.metadata?.priceVariantId

      if (!userId || !priceVariantId) break

      const parsedVariant = z.string().uuid().safeParse(priceVariantId)
      if (!parsedVariant.success) break

      const variant = await prisma.priceVariant.findUnique({
        where: { id: parsedVariant.data },
      })
      if (!variant) break

      // Idempotency
      const existing = await prisma.entitlement.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      })
      if (existing) break

      const paidAmountCents = session.amount_total ?? undefined
      const paidCurrency = session.currency?.toUpperCase() ?? undefined
      const isRecurring = variant.billingType === 'recurring'

      await createEntitlement({
        userId,
        courseId: variant.courseId ?? undefined,
        bundleId: variant.bundleId ?? undefined,
        priceVariantId: variant.id,
        source: isRecurring ? 'SUBSCRIPTION' : 'PURCHASE',
        ...(isRecurring
          ? { stripeSubscriptionId: session.subscription as string }
          : {}),
        stripeCheckoutSessionId: session.id,
        paidAmountCents,
        paidCurrency,
      })

      const discountCodeId = session.metadata?.discountCodeId
      if (discountCodeId) {
        const parsed = z.string().uuid().safeParse(discountCodeId)
        if (parsed.success) {
          await prisma.discountCode.update({
            where: { id: parsed.data },
            data: { currentUses: { increment: 1 } },
          })
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      if (subscription.status === 'active') {
        await updateEntitlementStatus(subscription.id, 'ACTIVE')
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
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.id) {
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
