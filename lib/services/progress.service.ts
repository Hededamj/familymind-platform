import { prisma } from '@/lib/prisma'
import { checkAndNotifyMilestones } from './engagement.service'

export async function markContentStarted(userId: string, contentUnitId: string) {
  return prisma.userContentProgress.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: {}, // Don't update if already exists
    create: { userId, contentUnitId },
  })
}

export async function markContentCompleted(userId: string, contentUnitId: string) {
  const result = await prisma.userContentProgress.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: { completedAt: new Date() },
    create: { userId, contentUnitId, completedAt: new Date() },
  })

  // Check milestones after content completion (non-blocking)
  checkAndNotifyMilestones(userId).catch(console.error)

  return result
}

export async function getContentProgress(userId: string, contentUnitId: string) {
  return prisma.userContentProgress.findUnique({
    where: { userId_contentUnitId: { userId, contentUnitId } },
  })
}

export async function getCourseProgress(userId: string, productId: string) {
  const lessons = await prisma.courseLesson.findMany({
    where: { productId },
    include: {
      contentUnit: {
        include: {
          userProgress: { where: { userId } },
        },
      },
    },
    orderBy: { position: 'asc' },
  })

  const totalLessons = lessons.length
  const completedLessons = lessons.filter(
    (l) => l.contentUnit.userProgress[0]?.completedAt
  ).length
  const percentComplete =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

  return {
    totalLessons,
    completedLessons,
    percentComplete,
    lessons: lessons.map((l) => ({
      id: l.id,
      contentUnitId: l.contentUnit.id,
      title: l.contentUnit.title,
      slug: l.contentUnit.slug,
      position: l.position,
      started: !!l.contentUnit.userProgress[0],
      completed: !!l.contentUnit.userProgress[0]?.completedAt,
    })),
  }
}

export async function getUserInProgressCourses(userId: string) {
  // Find courses where user has an active entitlement
  const entitlements = await prisma.entitlement.findMany({
    where: { userId, status: 'ACTIVE', product: { type: 'COURSE' } },
    include: { product: true },
  })

  const courses: (Awaited<ReturnType<typeof getCourseProgress>> & { product: typeof entitlements[number]['product'] })[] = []
  for (const ent of entitlements) {
    const progress = await getCourseProgress(userId, ent.product.id)
    if (progress.totalLessons > 0) {
      courses.push({
        product: ent.product,
        ...progress,
      })
    }
  }

  return courses
}
