import { prisma } from '@/lib/prisma'
import { createTagSchema, updateTagSchema } from '@/lib/validators/admin-tag'
import type { z } from 'zod'

type CreateTagInput = z.infer<typeof createTagSchema>
type UpdateTagInput = z.infer<typeof updateTagSchema>

export async function listTags() {
  return prisma.adminTag.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createTag(data: CreateTagInput) {
  const validated = createTagSchema.parse(data)
  return prisma.adminTag.create({ data: validated })
}

export async function updateTag(id: string, data: UpdateTagInput) {
  const validated = updateTagSchema.parse(data)
  return prisma.adminTag.update({ where: { id }, data: validated })
}

export async function deleteTag(id: string) {
  return prisma.adminTag.delete({ where: { id } })
}

const MAX_BULK_TAG_USERS = 200

export async function addTagToUsers(tagId: string, userIds: string[]) {
  if (userIds.length > MAX_BULK_TAG_USERS) {
    throw new Error(`Maks ${MAX_BULK_TAG_USERS} brugere per bulk-operation`)
  }
  // Verify tag exists
  await prisma.adminTag.findUniqueOrThrow({ where: { id: tagId } })

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
