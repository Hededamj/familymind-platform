import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { getStripeAccountForUser } from '@/lib/services/stripe-connect.service'
import { findOrCreateStripeCustomer } from '@/lib/services/stripe-customer.service'
import { createCheckoutSchema } from '@/lib/validators/checkout'
import type { z } from 'zod'

type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>

export async function createCheckoutSession(
  userId: string,
  data: CreateCheckoutInput
) {
  const validated = createCheckoutSchema.parse(data)
  const stripe = getStripe()

  const variant = await prisma.priceVariant.findUnique({
    where: { id: validated.priceVariantId },
    include: { course: true, bundle: true },
  })
  if (!variant) throw new Error('Ugyldig prisvariant')
  if (!variant.isActive) throw new Error('Prisvariant er ikke aktiv')
  if (!variant.stripePriceId)
    throw new Error('Prisvariant er ikke synkroniseret med Stripe')

  const owner = variant.course ?? variant.bundle
  if (!owner) throw new Error('Prisvariant har ingen ejer')

  const isRecurring = variant.billingType === 'recurring'

  await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  // Resolve tenant's Stripe Connect account (undefined when not in use).
  const stripeAccountId = await getStripeAccountForUser(userId)

  // Reuse a single Stripe Customer per user instead of creating a fresh one
  // for each checkout. Keeps subscription history, payment methods, and tax
  // location consolidated in the customer's billing portal.
  const customerId = await findOrCreateStripeCustomer(userId, { stripeAccountId })

  let discountCouponId: string | undefined
  let discountCodeId: string | undefined

  if (validated.discountCode) {
    const discount = await validateDiscountCode(validated.discountCode, {
      courseId: variant.courseId ?? undefined,
      bundleId: variant.bundleId ?? undefined,
    })
    discountCouponId = discount.stripeCouponId
    discountCodeId = discount.discountId
  }

  const cancelSlug = owner.slug
  const cancelPath = variant.courseId ? `/courses/${cancelSlug}` : `/bundles/${cancelSlug}`

  const session = await stripe.checkout.sessions.create(
    {
      mode: isRecurring ? 'subscription' : 'payment',
      customer: customerId,
      line_items: [{ price: variant.stripePriceId, quantity: 1 }],
      ...(discountCouponId ? { discounts: [{ coupon: discountCouponId }] } : {}),
      ...(isRecurring && variant.trialDays
        ? { subscription_data: { trial_period_days: variant.trialDays } }
        : {}),
      // TODO(vat): enable Stripe Tax once revisor has confirmed B2C/B2B
      // posture for DK MOMS. Adding `automatic_tax: { enabled: true }`
      // here will compute and collect VAT based on the customer's
      // billing address (which is now persisted on the reused Customer).
      // Requires a configured Tax Origin in Stripe Dashboard.
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${cancelPath}`,
      metadata: {
        userId,
        priceVariantId: variant.id,
        ...(variant.courseId ? { courseId: variant.courseId } : {}),
        ...(variant.bundleId ? { bundleId: variant.bundleId } : {}),
        ...(discountCodeId ? { discountCodeId } : {}),
      },
    },
    stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
  )

  return { url: session.url }
}

export async function validateDiscountCode(
  code: string,
  target: { courseId?: string; bundleId?: string }
) {
  const discount = await prisma.discountCode.findUnique({ where: { code } })

  if (!discount) throw new Error('Ugyldig rabatkode')
  if (!discount.isActive) throw new Error('Rabatkoden er ikke aktiv')
  if (discount.validUntil && discount.validUntil < new Date())
    throw new Error('Rabatkoden er udl\u00f8bet')
  if (discount.maxUses && discount.currentUses >= discount.maxUses)
    throw new Error('Rabatkoden er brugt op')

  if (discount.applicableCourseId && discount.applicableCourseId !== target.courseId) {
    throw new Error('Rabatkoden g\u00e6lder ikke for dette kursus')
  }
  if (discount.applicableBundleId && discount.applicableBundleId !== target.bundleId) {
    throw new Error('Rabatkoden g\u00e6lder ikke for denne bundle')
  }

  return {
    discountId: discount.id,
    type: discount.type,
    value: discount.value,
    stripeCouponId: discount.stripeCouponId ?? undefined,
  }
}
