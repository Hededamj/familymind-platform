import { prisma } from '@/lib/prisma'

export async function createBundle(data: {
  title: string
  slug: string
  description?: string
  coverImageUrl?: string
  isActive?: boolean
}) {
  return prisma.bundle.create({ data })
}

export async function updateBundle(
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
  return prisma.bundle.update({ where: { id }, data: data as never })
}

export async function deleteBundle(id: string) {
  return prisma.bundle.delete({ where: { id } })
}

export async function listBundles(filters?: { isActive?: boolean }) {
  return prisma.bundle.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    include: { courses: { include: { course: true } }, priceVariants: true },
  })
}

export async function getBundle(slug: string) {
  return prisma.bundle.findUnique({
    where: { slug },
    include: {
      courses: { orderBy: { position: 'asc' }, include: { course: true } },
      priceVariants: { where: { isActive: true }, orderBy: { position: 'asc' } },
    },
  })
}

export async function getBundleById(id: string) {
  return prisma.bundle.findUnique({
    where: { id },
    include: {
      courses: { orderBy: { position: 'asc' }, include: { course: true } },
      priceVariants: { orderBy: { position: 'asc' } },
    },
  })
}

export async function addCourseToBundle(
  bundleId: string,
  courseId: string,
  position = 0
) {
  return prisma.bundleCourse.create({ data: { bundleId, courseId, position } })
}

export async function removeCourseFromBundle(bundleId: string, courseId: string) {
  return prisma.bundleCourse.deleteMany({ where: { bundleId, courseId } })
}

export async function reorderCoursesInBundle(
  updates: { id: string; position: number }[]
) {
  return prisma.$transaction(
    updates.map((u) =>
      prisma.bundleCourse.update({ where: { id: u.id }, data: { position: u.position } })
    )
  )
}
