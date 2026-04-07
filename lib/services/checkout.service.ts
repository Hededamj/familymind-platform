import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { createCheckoutSchema } from '@/lib/validators/checkout'
import type { z } from 'zod'

type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>

export async function createCheckoutSession(
  userId: string,
  data: CreateCheckoutInput
) {
  const validated = createCheckoutSchema.parse(data)
  const stripe = getStripe()

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: validated.productId },
  })

  // Resolve PriceVariant if specified, otherwise fall back to legacy product price
  let variant: Awaited<ReturnType<typeof prisma.priceVariant.findUnique>> = null
  if (validated.priceVariantId) {
    variant = await prisma.priceVariant.findUnique({
      where: { id: validated.priceVariantId },
    })
    if (!variant || variant.productId !== product.id) {
      throw new Error('Ugyldig prisvariant')
    }
    if (!variant.isActive) {
      throw new Error('Prisvariant er ikke aktiv')
    }
    if (!variant.stripePriceId) {
      throw new Error('Prisvariant er ikke synkroniseret med Stripe')
    }
  } else if (!product.stripePriceId) {
    throw new Error('Product is not synced to Stripe')
  }

  const stripePriceId = variant?.stripePriceId ?? product.stripePriceId!
  // Determine checkout mode: variant takes precedence
  const isRecurring = variant
    ? variant.billingType === 'recurring'
    : product.type === 'SUBSCRIPTION'

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })

  // Resolve tenant's Stripe Connect account (if any)
  let stripeAccountId: string | undefined
  if (user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    })
    if (org?.stripeAccountId && org.stripeAccountStatus === 'active') {
      stripeAccountId = org.stripeAccountId
    }
    // If no active Connect account, fall back to platform Stripe key (no stripeAccount header)
  }

  let discountCouponId: string | undefined
  let discountCodeId: string | undefined

  if (validated.discountCode) {
    const discount = await validateDiscountCode(
      validated.discountCode,
      validated.productId
    )
    discountCouponId = discount.stripeCouponId
    discountCodeId = discount.discountId
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: isRecurring ? 'subscription' : 'payment',
      customer_email: user.email,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      ...(discountCouponId ? { discounts: [{ coupon: discountCouponId }] } : {}),
      ...(isRecurring && variant?.trialDays
        ? { subscription_data: { trial_period_days: variant.trialDays } }
        : {}),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
      metadata: {
        userId,
        productId: product.id,
        ...(variant ? { priceVariantId: variant.id } : {}),
        ...(discountCodeId ? { discountCodeId } : {}),
      },
    },
    stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
  )

  return { url: session.url }
}

export async function validateDiscountCode(
  code: string,
  productId: string
) {
  const discount = await prisma.discountCode.findUnique({ where: { code } })

  if (!discount) throw new Error('Ugyldig rabatkode')
  if (!discount.isActive) throw new Error('Rabatkoden er ikke aktiv')
  if (discount.validUntil && discount.validUntil < new Date())
    throw new Error('Rabatkoden er udl\u00f8bet')
  if (discount.maxUses && discount.currentUses >= discount.maxUses)
    throw new Error('Rabatkoden er brugt op')
  if (
    discount.applicableProductId &&
    discount.applicableProductId !== productId
  ) {
    throw new Error('Rabatkoden g\u00e6lder ikke for dette produkt')
  }

  return {
    discountId: discount.id,
    type: discount.type,
    value: discount.value,
    stripeCouponId: discount.stripeCouponId ?? undefined,
  }
}
