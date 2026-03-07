'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import * as communityService from '@/lib/services/community.service'

const uuid = z.string().uuid()

export async function createPromptAction(roomId: string, promptText: string) {
  await requireAdmin()
  uuid.parse(roomId)
  const text = promptText.trim()
  if (!text) return { error: 'Prompt-tekst er påkrævet' }

  await communityService.createRoomPrompt({ roomId, promptText: text })
  revalidatePath('/admin/community/prompts')
  return { success: true }
}

export async function bulkImportPromptsAction(roomId: string, texts: string) {
  await requireAdmin()
  uuid.parse(roomId)
  const lines = texts
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return { error: 'Ingen prompts fundet' }

  for (const line of lines) {
    await communityService.createRoomPrompt({ roomId, promptText: line })
  }
  revalidatePath('/admin/community/prompts')
  return { success: true, count: lines.length }
}

export async function updatePromptAction(
  id: string,
  data: { promptText?: string; priority?: number; isPaused?: boolean }
) {
  await requireAdmin()
  uuid.parse(id)
  await communityService.updateRoomPrompt(id, data)
  revalidatePath('/admin/community/prompts')
  return { success: true }
}

export async function deletePromptAction(id: string) {
  await requireAdmin()
  uuid.parse(id)
  await communityService.deleteRoomPrompt(id)
  revalidatePath('/admin/community/prompts')
  return { success: true }
}
