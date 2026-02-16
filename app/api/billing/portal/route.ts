import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  const stripe = getStripe()

  // Find user's active subscription entitlement
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: user.id,
      status: 'ACTIVE',
      stripeSubscriptionId: { not: null },
    },
  })

  if (!entitlement?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'Intet aktivt abonnement fundet' },
      { status: 404 }
    )
  }

  const subscription = await stripe.subscriptions.retrieve(
    entitlement.stripeSubscriptionId
  )

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.customer as string,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
