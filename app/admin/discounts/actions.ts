'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { revalidatePath } from 'next/cache'

export async function createDiscountAction(data: {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  maxUses?: number | null
  validFrom?: string
  validUntil?: string | null
  applicableProductId?: string | null
  isActive?: boolean
  duration?: string
  durationInMonths?: number | null
}) {
  await requireAdmin()

  const stripe = getStripe()
  const duration = data.duration || 'once'

  // Create Stripe coupon first — if this fails, we don't save to DB
  const couponParams: Stripe.CouponCreateParams = {
    name: data.code.toUpperCase(),
    duration: duration as 'once' | 'repeating' | 'forever',
  }

  if (data.type === 'PERCENTAGE') {
    couponParams.percent_off = data.value
  } else {
    couponParams.amount_off = data.value // already in cents/øre
    couponParams.currency = 'dkk'
  }

  if (duration === 'repeating' && data.durationInMonths) {
    couponParams.duration_in_months = data.durationInMonths
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
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      maxUses: data.maxUses || null,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      applicableProductId: data.applicableProductId || null,
      isActive: data.isActive ?? true,
      stripeCouponId: stripeCoupon.id,
      duration,
      durationInMonths: duration === 'repeating' ? (data.durationInMonths || null) : null,
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
  const discount = await prisma.discountCode.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code.toUpperCase() }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
      ...(data.applicableProductId !== undefined && { applicableProductId: data.applicableProductId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.validUntil !== undefined && {
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      }),
    },
  })
  revalidatePath('/admin/discounts')
  return discount
}

export async function deleteDiscountAction(id: string) {
  await requireAdmin()

  const discount = await prisma.discountCode.findUniqueOrThrow({ where: { id } })

  // Delete from Stripe (best-effort — don't block DB deletion)
  if (discount.stripeCouponId) {
    try {
      await getStripe().coupons.del(discount.stripeCouponId)
    } catch (err) {
      console.error(`Failed to delete Stripe coupon ${discount.stripeCouponId}:`, err)
    }
  }

  await prisma.discountCode.delete({ where: { id } })
  revalidatePath('/admin/discounts')
}

export async function toggleDiscountAction(id: string, isActive: boolean) {
  await requireAdmin()
  await prisma.discountCode.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/discounts')
}
