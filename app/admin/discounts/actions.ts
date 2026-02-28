'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { createDiscountSchema, updateDiscountSchema } from '@/lib/validators/settings'

const uuid = z.string().uuid()

export async function createDiscountAction(data: {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  maxUses?: number | null
  validFrom?: string
  validUntil?: string | null
  applicableProductId?: string | null
  isActive?: boolean
  duration?: 'once' | 'repeating' | 'forever'
  durationInMonths?: number | null
}) {
  await requireAdmin()
  const valid = createDiscountSchema.parse(data)

  const stripe = getStripe()
  const duration = valid.duration || 'once'

  // Create Stripe coupon first — if this fails, we don't save to DB
  const couponParams: Stripe.CouponCreateParams = {
    name: valid.code.toUpperCase(),
    duration: duration as 'once' | 'repeating' | 'forever',
  }

  if (valid.type === 'PERCENTAGE') {
    couponParams.percent_off = valid.value
  } else {
    couponParams.amount_off = valid.value // already in cents/øre
    couponParams.currency = 'dkk'
  }

  if (duration === 'repeating' && valid.durationInMonths) {
    couponParams.duration_in_months = valid.durationInMonths
  }

  let stripeCoupon
  try {
    stripeCoupon = await stripe.coupons.create(couponParams)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukendt fejl'
    throw new Error(`Kunne ikke oprette rabat i Stripe: ${message}`)
  }

  const discount = await prisma.discountCode.create({
    data: {
      code: valid.code.toUpperCase(),
      type: valid.type,
      value: valid.value,
      maxUses: valid.maxUses || null,
      validFrom: valid.validFrom ? new Date(valid.validFrom) : new Date(),
      validUntil: valid.validUntil ? new Date(valid.validUntil) : null,
      applicableProductId: valid.applicableProductId || null,
      isActive: valid.isActive ?? true,
      stripeCouponId: stripeCoupon.id,
      duration,
      durationInMonths: duration === 'repeating' ? (valid.durationInMonths || null) : null,
    },
  })
  revalidatePath('/admin/discounts')
  return discount
}

export async function updateDiscountAction(
  id: string,
  data: Partial<{
    code: string
    maxUses: number | null
    validUntil: string | null
    applicableProductId: string | null
    isActive: boolean
  }>
) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const valid = updateDiscountSchema.parse(data)

  const discount = await prisma.discountCode.update({
    where: { id: validId },
    data: {
      ...(valid.code !== undefined && { code: valid.code.toUpperCase() }),
      ...(valid.maxUses !== undefined && { maxUses: valid.maxUses }),
      ...(valid.applicableProductId !== undefined && { applicableProductId: valid.applicableProductId }),
      ...(valid.isActive !== undefined && { isActive: valid.isActive }),
      ...(valid.validUntil !== undefined && {
        validUntil: valid.validUntil ? new Date(valid.validUntil) : null,
      }),
    },
  })
  revalidatePath('/admin/discounts')
  return discount
}

export async function deleteDiscountAction(id: string) {
  await requireAdmin()
  const validId = uuid.parse(id)

  const discount = await prisma.discountCode.findUniqueOrThrow({ where: { id: validId } })

  // Delete from Stripe (best-effort — don't block DB deletion)
  if (discount.stripeCouponId) {
    try {
      await getStripe().coupons.del(discount.stripeCouponId)
    } catch (err) {
      console.error(`Failed to delete Stripe coupon ${discount.stripeCouponId}:`, err)
    }
  }

  await prisma.discountCode.delete({ where: { id: validId } })
  revalidatePath('/admin/discounts')
}

export async function toggleDiscountAction(id: string, isActive: boolean) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const validActive = z.boolean().parse(isActive)
  await prisma.discountCode.update({ where: { id: validId }, data: { isActive: validActive } })
  revalidatePath('/admin/discounts')
}
