'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
}) {
  await requireAdmin()
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
    },
  })
  revalidatePath('/admin/discounts')
  return discount
}

export async function updateDiscountAction(
  id: string,
  data: Partial<{
    code: string
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
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
      ...data,
      code: data.code?.toUpperCase(),
      validUntil:
        data.validUntil !== undefined
          ? data.validUntil
            ? new Date(data.validUntil)
            : null
          : undefined,
    },
  })
  revalidatePath('/admin/discounts')
  return discount
}

export async function deleteDiscountAction(id: string) {
  await requireAdmin()
  await prisma.discountCode.delete({ where: { id } })
  revalidatePath('/admin/discounts')
}

export async function toggleDiscountAction(id: string, isActive: boolean) {
  await requireAdmin()
  await prisma.discountCode.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/discounts')
}
