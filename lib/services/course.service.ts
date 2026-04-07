import { prisma } from '@/lib/prisma'

export async function createCourse(data: {
  title: string
  slug: string
  description?: string
  coverImageUrl?: string
  isActive?: boolean
}) {
  return prisma.course.create({ data })
}

export async function updateCourse(
  id: string,
  data: Partial<{
    title: string
    slug: string
    description: string | null
    coverImageUrl: string | null
    isActive: boolean
    stripeProductId: string | null
    landingPage: unknown
  }>
) {
  return prisma.course.update({ where: { id }, data: data as never })
}

export async function deleteCourse(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.course.delete({ where: { id } })
  })
}

export async function listCourses(filters?: { isActive?: boolean }) {
  return prisma.course.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    include: { priceVariants: true },
  })
}

export async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      modules: { orderBy: { position: 'asc' } },
      lessons: {
        orderBy: { position: 'asc' },
        include: { contentUnit: true },
      },
      priceVariants: { where: { isActive: true }, orderBy: { position: 'asc' } },
    },
  })
}

export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { position: 'asc' } },
      lessons: { orderBy: { position: 'asc' }, include: { contentUnit: true } },
      priceVariants: { orderBy: { position: 'asc' } },
    },
  })
}

export async function addLesson(
  courseId: string,
  data: { contentUnitId: string; moduleId?: string; position: number; isFreePreview?: boolean }
) {
  return prisma.courseLesson.create({ data: { courseId, ...data } })
}

export async function removeLesson(id: string) {
  return prisma.courseLesson.delete({ where: { id } })
}

export async function reorderLessons(updates: { id: string; position: number }[]) {
  return prisma.$transaction(
    updates.map((u) =>
      prisma.courseLesson.update({ where: { id: u.id }, data: { position: u.position } })
    )
  )
}

export async function setLessonFreePreview(id: string, isFreePreview: boolean) {
  return prisma.courseLesson.update({ where: { id }, data: { isFreePreview } })
}

export async function createModule(
  courseId: string,
  data: { title: string; description?: string; position: number }
) {
  return prisma.courseModule.create({ data: { courseId, ...data } })
}

export async function updateModule(
  id: string,
  data: Partial<{ title: string; description: string | null; position: number }>
) {
  return prisma.courseModule.update({ where: { id }, data: data as never })
}

export async function deleteModule(id: string) {
  return prisma.courseModule.delete({ where: { id } })
}

export async function reorderModules(updates: { id: string; position: number }[]) {
  return prisma.$transaction(
    updates.map((u) =>
      prisma.courseModule.update({ where: { id: u.id }, data: { position: u.position } })
    )
  )
}
