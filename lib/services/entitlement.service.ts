import { prisma } from '@/lib/prisma'

const activeEntitlementFilter = {
  status: 'ACTIVE' as const,
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
}

export async function createEntitlement(
  data: {
    userId: string
    courseId?: string
    bundleId?: string
    source: 'PURCHASE' | 'SUBSCRIPTION' | 'GIFT' | 'B2B_LICENSE'
    stripeSubscriptionId?: string
    stripeCheckoutSessionId?: string
    organizationId?: string
    expiresAt?: Date
    paidAmountCents?: number
    paidCurrency?: string
    priceVariantId?: string
  },
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  if ((!data.courseId && !data.bundleId) || (data.courseId && data.bundleId)) {
    throw new Error('Entitlement skal være knyttet til enten kursus eller bundle')
  }
  const db = tx ?? prisma
  return db.entitlement.create({ data })
}

export async function getUserEntitlements(userId: string) {
  return prisma.entitlement.findMany({
    where: { userId, ...activeEntitlementFilter },
    include: { course: true, bundle: true, priceVariant: true },
  })
}

export async function hasAccessToCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  // Direct course entitlement
  const direct = await prisma.entitlement.findFirst({
    where: { userId, courseId, ...activeEntitlementFilter },
  })
  if (direct) return true

  // Via bundle that contains the course
  const viaBundle = await prisma.entitlement.findFirst({
    where: {
      userId,
      ...activeEntitlementFilter,
      bundle: { courses: { some: { courseId } } },
    },
  })
  return !!viaBundle
}

export async function hasAccessToLesson(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true, isFreePreview: true },
  })
  if (!lesson) return false
  if (lesson.isFreePreview) return true
  return hasAccessToCourse(userId, lesson.courseId)
}

export async function canAccessContent(
  userId: string,
  contentUnitId: string
): Promise<boolean> {
  const content = await prisma.contentUnit.findUnique({
    where: { id: contentUnitId },
    include: { courseLessons: true },
  })
  if (!content) return false
  if (content.isFree) return true

  // Check any course this content belongs to (including free previews)
  for (const lesson of content.courseLessons) {
    if (lesson.isFreePreview) return true
    if (await hasAccessToCourse(userId, lesson.courseId)) return true
  }
  return false
}

export async function revokeEntitlement(id: string) {
  return prisma.entitlement.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })
}

export async function updateEntitlementStatus(
  stripeSubscriptionId: string,
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
) {
  return prisma.entitlement.updateMany({
    where: { stripeSubscriptionId },
    data: {
      status,
      cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
    },
  })
}
