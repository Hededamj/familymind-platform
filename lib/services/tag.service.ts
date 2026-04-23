import { prisma } from '@/lib/prisma'
import { createTagSchema, updateTagSchema, slugify } from '@/lib/validators/tag'
import type { z } from 'zod'

type CreateTagInput = z.input<typeof createTagSchema>
type UpdateTagInput = z.input<typeof updateTagSchema>

export async function listTags() {
  return prisma.contentTag.findMany({
    include: { _count: { select: { users: true, contentUnits: true, communityRooms: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createTag(data: CreateTagInput) {
  const validated = createTagSchema.parse(data)
  const slug = validated.slug ?? slugify(validated.name)
  return prisma.contentTag.create({
    data: { name: validated.name, slug, color: validated.color },
  })
}

export async function updateTag(id: string, data: UpdateTagInput) {
  const validated = updateTagSchema.parse(data)
  const patch: { name?: string; slug?: string; color?: string } = {}
  if (validated.name !== undefined) patch.name = validated.name
  if (validated.slug !== undefined) patch.slug = validated.slug
  if (validated.color !== undefined) patch.color = validated.color
  return prisma.contentTag.update({ where: { id }, data: patch })
}

export async function deleteTag(id: string) {
  return prisma.contentTag.delete({ where: { id } })
}

const MAX_BULK_TAG_USERS = 200

export async function addTagToUsers(tagId: string, userIds: string[]) {
  if (userIds.length > MAX_BULK_TAG_USERS) {
    throw new Error(`Maks ${MAX_BULK_TAG_USERS} brugere per bulk-operation`)
  }
  await prisma.contentTag.findUniqueOrThrow({ where: { id: tagId } })

  return prisma.$transaction(
    userIds.map((userId) =>
      prisma.userTag.upsert({
        where: { userId_tagId: { userId, tagId } },
        create: { userId, tagId },
        update: {},
      })
    )
  )
}

export async function removeTagFromUsers(tagId: string, userIds: string[]) {
  if (userIds.length > MAX_BULK_TAG_USERS) {
    throw new Error(`Maks ${MAX_BULK_TAG_USERS} brugere per bulk-operation`)
  }
  return prisma.userTag.deleteMany({
    where: { tagId, userId: { in: userIds } },
  })
}
