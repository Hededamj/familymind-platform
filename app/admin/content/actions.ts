'use server'

import { requireAdmin } from '@/lib/auth'
import * as contentService from '@/lib/services/content.service'
import { createContentUnitSchema, updateContentUnitSchema } from '@/lib/validators/content'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

type CreateInput = z.input<typeof createContentUnitSchema>
type UpdateInput = z.input<typeof updateContentUnitSchema>

export async function createContentAction(formData: CreateInput) {
  await requireAdmin()
  const validated = createContentUnitSchema.parse(formData)
  const result = await contentService.createContentUnit(validated)
  revalidatePath('/admin/content')
  return result
}

export async function updateContentAction(id: string, formData: UpdateInput) {
  await requireAdmin()
  const validated = updateContentUnitSchema.parse(formData)
  const result = await contentService.updateContentUnit(id, validated)
  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${id}/edit`)
  return result
}

export async function deleteContentAction(id: string) {
  await requireAdmin()
  await contentService.deleteContentUnit(id)
  revalidatePath('/admin/content')
}

export async function publishContentAction(id: string) {
  await requireAdmin()
  await contentService.publishContentUnit(id)
  revalidatePath('/admin/content')
}

export async function unpublishContentAction(id: string) {
  await requireAdmin()
  await contentService.unpublishContentUnit(id)
  revalidatePath('/admin/content')
}
