import { prisma } from '@/lib/prisma'
import { getActiveStripeAccount } from '@/lib/services/stripe-connect.service'
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

  if (!product.stripePriceId) {
    throw new Error('Product is not synced to Stripe')
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })

  if (!user.organizationId) {
    throw new Error('Bruger tilhører ingen organisation')
  }

  // Hent tenantens aktive Stripe-konto
  const stripeAccountId = await getActiveStripeAccount(user.organizationId)

  let discountId: string | undefined
  if (validated.discountCode) {
    const discount = await validateDiscountCode(
      validated.discountCode,
      validated.productId
    )
    if (discount.stripeCouponId) {
      discountId = discount.stripeCouponId
    }
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: product.type === 'SUBSCRIPTION' ? 'subscription' : 'payment',
      customer_email: user.email,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      ...(discountId ? { discounts: [{ coupon: discountId }] } : {}),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
      metadata: { userId, productId: product.id },
    },
    {
      stripeAccount: stripeAccountId,
    }
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
    stripeCouponId: undefined as string | undefined, // Will be set when Stripe integration is complete
  }
}
