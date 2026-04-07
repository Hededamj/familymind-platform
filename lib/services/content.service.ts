import { prisma } from '@/lib/prisma'
import { createContentUnitSchema, updateContentUnitSchema } from '@/lib/validators/content'
import type { z } from 'zod'

type CreateContentInput = z.infer<typeof createContentUnitSchema>
type UpdateContentInput = z.infer<typeof updateContentUnitSchema>

export async function createContentUnit(data: CreateContentInput) {
  const validated = createContentUnitSchema.parse(data)
  const { tagIds, ...contentData } = validated

  return prisma.contentUnit.create({
    data: {
      ...contentData,
      tags: tagIds
        ? {
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
  })
}

export async function updateContentUnit(id: string, data: UpdateContentInput) {
  const validated = updateContentUnitSchema.parse(data)
  const { tagIds, ...contentData } = validated

  return prisma.$transaction(async (tx) => {
    if (tagIds !== undefined) {
      await tx.contentUnitTag.deleteMany({ where: { contentUnitId: id } })
      if (tagIds.length > 0) {
        await tx.contentUnitTag.createMany({
          data: tagIds.map((tagId) => ({ contentUnitId: id, tagId })),
        })
      }
    }

    return tx.contentUnit.update({
      where: { id },
      data: contentData,
      include: { tags: { include: { tag: true } } },
    })
  })
}

export async function deleteContentUnit(id: string) {
  return prisma.contentUnit.delete({ where: { id } })
}

export async function listContentUnits(filters?: {
  mediaType?: string
  tagSlug?: string
  published?: boolean
  search?: string
}) {
  return prisma.contentUnit.findMany({
    where: {
      ...(filters?.mediaType && { mediaType: filters.mediaType as any }),
      ...(filters?.tagSlug && {
        tags: { some: { tag: { slug: filters.tagSlug } } },
      }),
      ...(filters?.published !== undefined && {
        publishedAt: filters.published ? { not: null } : null,
      }),
      ...(filters?.search && {
        OR: [
          {
            title: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getContentUnit(slug: string) {
  return prisma.contentUnit.findUnique({
    where: { slug },
    include: { tags: { include: { tag: true } } },
  })
}

export async function getContentUnitById(id: string) {
  return prisma.contentUnit.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  })
}

export async function publishContentUnit(id: string) {
  return prisma.contentUnit.update({
    where: { id },
    data: { publishedAt: new Date() },
  })
}

export async function unpublishContentUnit(id: string) {
  return prisma.contentUnit.update({
    where: { id },
    data: { publishedAt: null },
  })
}
