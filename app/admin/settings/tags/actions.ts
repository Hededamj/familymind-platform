'use server'

import { requireAdmin } from '@/lib/auth'
import * as tagService from '@/lib/services/admin-tag.service'
import { createTagSchema, updateTagSchema } from '@/lib/validators/admin-tag'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

type CreateInput = z.input<typeof createTagSchema>
type UpdateInput = z.input<typeof updateTagSchema>

export async function createTagAction(data: CreateInput) {
  await requireAdmin()
  const result = await tagService.createTag(data)
  revalidatePath('/admin/settings/tags')
  return result
}

export async function updateTagAction(id: string, data: UpdateInput) {
  await requireAdmin()
  const result = await tagService.updateTag(id, data)
  revalidatePath('/admin/settings/tags')
  return result
}

export async function deleteTagAction(id: string) {
  await requireAdmin()
  await tagService.deleteTag(id)
  revalidatePath('/admin/settings/tags')
}
