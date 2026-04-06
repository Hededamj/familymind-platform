import { prisma } from '@/lib/prisma'

export async function bookmarkLesson(userId: string, contentUnitId: string) {
  return prisma.savedContent.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: {},
    create: { userId, contentUnitId },
  })
}

export async function unbookmarkLesson(userId: string, contentUnitId: string) {
  return prisma.savedContent.deleteMany({
    where: { userId, contentUnitId },
  })
}

export async function getSavedLessons(userId: string) {
  return prisma.savedContent.findMany({
    where: { userId },
    include: {
      contentUnit: {
        select: {
          id: true,
          title: true,
          slug: true,
          mediaType: true,
          durationMinutes: true,
          thumbnailUrl: true,
        },
      },
    },
    orderBy: { savedAt: 'desc' },
  })
}

export async function isLessonBookmarked(userId: string, contentUnitId: string) {
  const record = await prisma.savedContent.findUnique({
    where: { userId_contentUnitId: { userId, contentUnitId } },
  })
  return !!record
}
