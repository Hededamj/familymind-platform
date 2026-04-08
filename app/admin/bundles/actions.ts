'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as bundleService from '@/lib/services/bundle.service'
import * as priceVariantService from '@/lib/services/price-variant.service'
import { listCourses } from '@/lib/services/course.service'
import type { BillingType, BillingInterval } from '@prisma/client'

function revalidateBundle(id?: string) {
  revalidatePath('/admin/bundles')
  if (id) revalidatePath(`/admin/bundles/${id}/edit`)
}

// ── Bundle CRUD ──

export async function createBundleAction(data: {
  title: string
  slug: string
  description?: string
}) {
  await requireAdmin()
  const result = await bundleService.createBundle(data)
  revalidateBundle()
  return result
}

export async function updateBundleAction(
  id: string,
  data: Partial<{
    title: string
    slug: string
    description: string | null
    coverImageUrl: string | null
    isActive: boolean
  }>
) {
  await requireAdmin()
  const result = await bundleService.updateBundle(id, data)
  revalidateBundle(id)
  return result
}

export async function deleteBundleAction(id: string) {
  await requireAdmin()
  await bundleService.deleteBundle(id)
  revalidatePath('/admin/bundles')
}

// ── Bundle courses ──

export async function addCourseToBundleAction(bundleId: string, courseId: string) {
  await requireAdmin()
  const count = await prisma.bundleCourse.count({ where: { bundleId } })
  const result = await bundleService.addCourseToBundle(bundleId, courseId, count)
  revalidateBundle(bundleId)
  return result
}

export async function removeCourseFromBundleAction(bundleId: string, courseId: string) {
  await requireAdmin()
  await bundleService.removeCourseFromBundle(bundleId, courseId)
  revalidateBundle(bundleId)
}

export async function listAvailableCoursesAction(bundleId: string) {
  await requireAdmin()
  const [all, existing] = await Promise.all([
    listCourses({ isActive: true }),
    prisma.bundleCourse.findMany({
      where: { bundleId },
      select: { courseId: true },
    }),
  ])
  const existingIds = new Set(existing.map((e) => e.courseId))
  return all
    .filter((c) => !existingIds.has(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
    }))
}

// ── Price Variants ──

type PriceVariantData = {
  label: string
  description?: string | null
  amountCents: number
  billingType: BillingType
  interval?: BillingInterval | null
  intervalCount?: number
  trialDays?: number | null
  isHighlighted?: boolean
}

export async function createPriceVariantAction(bundleId: string, data: PriceVariantData) {
  await requireAdmin()
  const result = await priceVariantService.createPriceVariant({ bundleId }, data)
  revalidateBundle(bundleId)
  return result
}

export async function updatePriceVariantAction(
  variantId: string,
  data: Partial<PriceVariantData>
) {
  await requireAdmin()
  const result = await priceVariantService.updatePriceVariant(variantId, data)
  if (result.bundleId) revalidateBundle(result.bundleId)
  return result
}

export async function deletePriceVariantAction(variantId: string) {
  await requireAdmin()
  const variant = await prisma.priceVariant.findUnique({
    where: { id: variantId },
    select: { bundleId: true },
  })
  await priceVariantService.deletePriceVariant(variantId)
  if (variant?.bundleId) revalidateBundle(variant.bundleId)
}

export async function syncVariantToStripeAction(variantId: string) {
  await requireAdmin()
  const result = await priceVariantService.syncVariantToStripe(variantId)
  if (result.bundleId) revalidateBundle(result.bundleId)
  return result
}
