'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import * as communityService from '@/lib/services/community.service'

const uuid = z.string().uuid()

const roomSchema = z.object({
  name: z.string().min(1, 'Navn er påkrævet').max(100),
  slug: z
    .string()
    .min(1, 'Slug er påkrævet')
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug må kun indeholde a-z, 0-9 og bindestreger'
    ),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
})

function parseTagIds(formData: FormData): string[] {
  const raw = formData.get('tagIds')
  if (!raw || typeof raw !== 'string') return []
  const parsed = JSON.parse(raw)
  return z.array(z.string().uuid()).parse(parsed)
}

export async function createRoomAction(formData: FormData) {
  await requireAdmin()

  const data = roomSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
    isPublic: formData.get('isPublic') === 'true',
    sortOrder: formData.get('sortOrder') || 0,
  })
  const tagIds = parseTagIds(formData)

  await communityService.createRoom(data, tagIds)
  revalidatePath('/admin/community/rooms')
}

export async function updateRoomAction(id: string, formData: FormData) {
  await requireAdmin()
  uuid.parse(id)

  const data = roomSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
    isPublic: formData.get('isPublic') === 'true',
    sortOrder: formData.get('sortOrder') || 0,
  })
  const tagIds = parseTagIds(formData)

  await communityService.updateRoom(id, data, tagIds)
  revalidatePath('/admin/community/rooms')
}

export async function archiveRoomAction(id: string) {
  await requireAdmin()
  uuid.parse(id)

  await communityService.deleteRoom(id)
  revalidatePath('/admin/community/rooms')
}
