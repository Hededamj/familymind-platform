'use server'

import { requireAdmin } from '@/lib/auth'
import * as adminUserService from '@/lib/services/admin-user.service'
import * as tagService from '@/lib/services/admin-tag.service'
import {
  updateUserRoleSchema,
  grantAccessSchema,
  bulkEmailSchema,
} from '@/lib/validators/admin-user'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

export async function updateUserRoleAction(
  userId: string,
  data: z.input<typeof updateUserRoleSchema>
) {
  await requireAdmin()
  const validated = updateUserRoleSchema.parse(data)
  const result = await adminUserService.updateUserRole(userId, validated.role)
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return result
}

export async function addTagToUsersAction(tagId: string, userIds: string[]) {
  await requireAdmin()
  await tagService.addTagToUsers(tagId, userIds)
  revalidatePath('/admin/users')
}

export async function removeTagFromUsersAction(
  tagId: string,
  userIds: string[]
) {
  await requireAdmin()
  await tagService.removeTagFromUsers(tagId, userIds)
  revalidatePath('/admin/users')
}

export async function grantAccessAction(
  data: z.input<typeof grantAccessSchema>
) {
  await requireAdmin()
  const validated = grantAccessSchema.parse(data)
  const { createEntitlement } = await import(
    '@/lib/services/entitlement.service'
  )
  const result = await createEntitlement({
    userId: validated.userId,
    productId: validated.productId,
    source: 'GIFT',
  })
  revalidatePath(`/admin/users/${validated.userId}`)
  return result
}

export async function revokeEntitlementAction(
  entitlementId: string,
  userId: string
) {
  await requireAdmin()
  const { revokeEntitlement } = await import(
    '@/lib/services/entitlement.service'
  )
  const result = await revokeEntitlement(entitlementId)
  revalidatePath(`/admin/users/${userId}`)
  return result
}

export async function bulkEmailAction(
  data: z.input<typeof bulkEmailSchema>
) {
  await requireAdmin()
  const validated = bulkEmailSchema.parse(data)

  const { prisma } = await import('@/lib/prisma')
  const users = await prisma.user.findMany({
    where: { id: { in: validated.userIds } },
    select: { email: true },
  })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const BATCH_SIZE = 50

  let sent = 0
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map((user) =>
        resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: user.email,
          subject: validated.subject,
          text: validated.body,
        })
      )
    )
    sent += batch.length
  }

  return { sent }
}
