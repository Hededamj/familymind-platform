import { prisma } from '@/lib/prisma'
import { checkAndNotifyMilestones } from './engagement.service'

export async function markContentStarted(userId: string, contentUnitId: string) {
  return prisma.userContentProgress.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: {},
    create: { userId, contentUnitId },
  })
}

export async function markContentCompleted(userId: string, contentUnitId: string) {
  const result = await prisma.userContentProgress.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: { completedAt: new Date() },
    create: { userId, contentUnitId, completedAt: new Date() },
  })
  checkAndNotifyMilestones(userId).catch(console.error)
  return result
}

export async function getContentProgress(userId: string, contentUnitId: string) {
  return prisma.userContentProgress.findUnique({
    where: { userId_contentUnitId: { userId, contentUnitId } },
  })
}

export async function getCourseProgress(userId: string, courseId: string) {
  const [lessons, moduleCount] = await Promise.all([
    prisma.courseLesson.findMany({
      where: { courseId },
      include: {
        contentUnit: {
          include: { userProgress: { where: { userId } } },
        },
      },
      orderBy: { position: 'asc' },
    }),
    prisma.courseModule.count({ where: { courseId } }),
  ])

  const totalLessons = lessons.length
  const completedLessons = lessons.filter(
    (l) => l.contentUnit.userProgress[0]?.completedAt
  ).length
  const percentComplete =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const totalDurationMinutes = lessons.reduce(
    (sum, l) => sum + (l.contentUnit.durationMinutes ?? 0),
    0
  )

  return {
    totalLessons,
    completedLessons,
    percentComplete,
    chapterCount: moduleCount,
    totalDurationMinutes,
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
  const entitlements = await prisma.entitlement.findMany({
    where: { userId, status: 'ACTIVE', courseId: { not: null } },
    include: { course: true },
  })

  const result: Array<
    Awaited<ReturnType<typeof getCourseProgress>> & {
      course: NonNullable<(typeof entitlements)[number]['course']>
    }
  > = []

  for (const ent of entitlements) {
    if (!ent.course) continue
    const progress = await getCourseProgress(userId, ent.course.id)
    if (progress.totalLessons === 0) continue
    result.push({ ...progress, course: ent.course })
  }

  return result
}
