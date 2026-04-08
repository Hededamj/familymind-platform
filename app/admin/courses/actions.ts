'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as courseService from '@/lib/services/course.service'
import * as priceVariantService from '@/lib/services/price-variant.service'
import { listContentUnits } from '@/lib/services/content.service'
import type { BillingType, BillingInterval } from '@prisma/client'

function revalidateCourse(id?: string) {
  revalidatePath('/admin/courses')
  if (id) revalidatePath(`/admin/courses/${id}/edit`)
}

// ── Course CRUD ──

export async function createCourseAction(data: {
  title: string
  slug: string
  description?: string
}) {
  await requireAdmin()
  const result = await courseService.createCourse(data)
  revalidateCourse()
  return result
}

export async function updateCourseAction(
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
  const result = await courseService.updateCourse(id, data)
  revalidateCourse(id)
  return result
}

export async function deleteCourseAction(id: string) {
  await requireAdmin()
  await courseService.deleteCourse(id)
  revalidatePath('/admin/courses')
}

// ── Modules ──

export async function addModuleAction(
  courseId: string,
  data: { title: string; description?: string }
) {
  await requireAdmin()
  const count = await prisma.courseModule.count({ where: { courseId } })
  const result = await courseService.createModule(courseId, {
    title: data.title,
    description: data.description,
    position: count,
  })
  revalidateCourse(courseId)
  return result
}

export async function updateModuleAction(
  id: string,
  data: Partial<{ title: string; description: string | null }>
) {
  await requireAdmin()
  const result = await courseService.updateModule(id, data)
  const mod = await prisma.courseModule.findUnique({ where: { id }, select: { courseId: true } })
  revalidateCourse(mod?.courseId)
  return result
}

export async function deleteModuleAction(id: string) {
  await requireAdmin()
  const mod = await prisma.courseModule.findUnique({ where: { id }, select: { courseId: true } })
  await courseService.deleteModule(id)
  revalidateCourse(mod?.courseId)
}

// ── Lessons ──

export async function addLessonAction(
  courseId: string,
  contentUnitId: string,
  moduleId?: string
) {
  await requireAdmin()
  const count = await prisma.courseLesson.count({
    where: { courseId, ...(moduleId ? { moduleId } : { moduleId: null }) },
  })
  const result = await courseService.addLesson(courseId, {
    contentUnitId,
    moduleId,
    position: count,
  })
  revalidateCourse(courseId)
  return result
}

export async function removeLessonAction(lessonId: string) {
  await requireAdmin()
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  })
  await courseService.removeLesson(lessonId)
  revalidateCourse(lesson?.courseId)
}

export async function setLessonFreePreviewAction(lessonId: string, isFreePreview: boolean) {
  await requireAdmin()
  const result = await courseService.setLessonFreePreview(lessonId, isFreePreview)
  revalidateCourse(result.courseId)
  return result
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

export async function createPriceVariantAction(courseId: string, data: PriceVariantData) {
  await requireAdmin()
  const result = await priceVariantService.createPriceVariant({ courseId }, data)
  revalidateCourse(courseId)
  return result
}

export async function updatePriceVariantAction(
  variantId: string,
  data: Partial<PriceVariantData>
) {
  await requireAdmin()
  const result = await priceVariantService.updatePriceVariant(variantId, data)
  if (result.courseId) revalidateCourse(result.courseId)
  return result
}

export async function deletePriceVariantAction(variantId: string) {
  await requireAdmin()
  const variant = await prisma.priceVariant.findUnique({
    where: { id: variantId },
    select: { courseId: true },
  })
  await priceVariantService.deletePriceVariant(variantId)
  if (variant?.courseId) revalidateCourse(variant.courseId)
}

export async function listAvailableContentUnitsAction(excludeIds: string[] = []) {
  await requireAdmin()
  const all = await listContentUnits({})
  return all
    .filter((c) => !excludeIds.includes(c.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      mediaType: c.mediaType,
      durationMinutes: c.durationMinutes,
    }))
}

export async function syncVariantToStripeAction(variantId: string) {
  await requireAdmin()
  const result = await priceVariantService.syncVariantToStripe(variantId)
  if (result.courseId) revalidateCourse(result.courseId)
  return result
}
