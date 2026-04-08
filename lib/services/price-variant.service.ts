import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import type { BillingType, BillingInterval } from '@prisma/client'

type PriceVariantInput = {
  label: string
  description?: string | null
  amountCents: number
  currency?: string
  billingType: BillingType
  interval?: BillingInterval | null
  intervalCount?: number
  trialDays?: number | null
  position?: number
  isActive?: boolean
  isHighlighted?: boolean
}

export async function createPriceVariant(
  target: { courseId?: string; bundleId?: string },
  data: PriceVariantInput
) {
  if ((!target.courseId && !target.bundleId) || (target.courseId && target.bundleId)) {
    throw new Error('PriceVariant skal være knyttet til enten et kursus eller en bundle')
  }
  return prisma.priceVariant.create({
    data: {
      courseId: target.courseId ?? null,
      bundleId: target.bundleId ?? null,
      ...data,
    },
  })
}

export async function updatePriceVariant(
  id: string,
  data: Partial<PriceVariantInput>
) {
  return prisma.priceVariant.update({ where: { id }, data: data as never })
}

export async function deletePriceVariant(id: string) {
  return prisma.priceVariant.delete({ where: { id } })
}

export async function syncVariantToStripe(variantId: string) {
  const variant = await prisma.priceVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { course: true, bundle: true },
  })

  const owner = variant.course ?? variant.bundle
  if (!owner) throw new Error('Variant har ingen ejer')

  const stripe = getStripe()
  let stripeProductId = owner.stripeProductId

  if (!stripeProductId) {
    const product = await stripe.products.create({
      name: owner.title,
      description: owner.description ?? undefined,
    })
    stripeProductId = product.id
    if (variant.courseId) {
      await prisma.course.update({
        where: { id: variant.courseId },
        data: { stripeProductId },
      })
    } else if (variant.bundleId) {
      await prisma.bundle.update({
        where: { id: variant.bundleId },
        data: { stripeProductId },
      })
    }
  }

  const price = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: variant.amountCents,
    currency: variant.currency.toLowerCase(),
    ...(variant.billingType === 'recurring' && variant.interval
      ? {
          recurring: {
            interval: variant.interval,
            interval_count: variant.intervalCount,
          },
        }
      : {}),
  })

  return prisma.priceVariant.update({
    where: { id: variantId },
    data: { stripePriceId: price.id },
  })
}
