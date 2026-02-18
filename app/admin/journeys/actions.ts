'use server'

import { requireAdmin } from '@/lib/auth'
import * as journeyService from '@/lib/services/journey.service'
import * as communityService from '@/lib/services/community.service'
import { revalidatePath } from 'next/cache'

// --- Journey CRUD ---

export async function createJourneyAction(data: {
  title: string
  description?: string
  slug: string
  targetAgeMin?: number
  targetAgeMax?: number
  estimatedDays?: number
}) {
  await requireAdmin()
  const result = await journeyService.createJourney(data)
  revalidatePath('/admin/journeys')
  return result
}

export async function updateJourneyAction(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    slug: string
    targetAgeMin: number | null
    targetAgeMax: number | null
    estimatedDays: number | null
    isActive: boolean
  }>
) {
  await requireAdmin()
  const result = await journeyService.updateJourney(id, data)
  revalidatePath('/admin/journeys')
  return result
}

export async function deleteJourneyAction(id: string) {
  await requireAdmin()
  await journeyService.deleteJourney(id)
  revalidatePath('/admin/journeys')
}

// --- Phase Management ---

export async function createPhaseAction(journeyId: string, title: string) {
  await requireAdmin()
  const result = await journeyService.createPhase(journeyId, title)
  revalidatePath('/admin/journeys')
  return result
}

export async function updatePhaseAction(
  id: string,
  data: { title?: string; position?: number }
) {
  await requireAdmin()
  const result = await journeyService.updatePhase(id, data)
  revalidatePath('/admin/journeys')
  return result
}

export async function deletePhaseAction(id: string) {
  await requireAdmin()
  await journeyService.deletePhase(id)
  revalidatePath('/admin/journeys')
}

// --- Day Management ---

export async function createDayAction(phaseId: string, title?: string) {
  await requireAdmin()
  const result = await journeyService.createDay(phaseId, title)
  revalidatePath('/admin/journeys')
  return result
}

export async function updateDayAction(
  id: string,
  data: { title?: string; position?: number }
) {
  await requireAdmin()
  const result = await journeyService.updateDay(id, data)
  revalidatePath('/admin/journeys')
  return result
}

export async function deleteDayAction(id: string) {
  await requireAdmin()
  await journeyService.deleteDay(id)
  revalidatePath('/admin/journeys')
}

// --- Day Content ---

export async function addContentToDayAction(
  dayId: string,
  contentUnitId: string
) {
  await requireAdmin()
  const result = await journeyService.addContentToDay(dayId, contentUnitId)
  revalidatePath('/admin/journeys')
  return result
}

export async function removeContentFromDayAction(id: string) {
  await requireAdmin()
  await journeyService.removeContentFromDay(id)
  revalidatePath('/admin/journeys')
}

// --- Day Actions (action items) ---

export async function createDayActionItemAction(
  dayId: string,
  data: { actionText: string; reflectionPrompt?: string }
) {
  await requireAdmin()
  const result = await journeyService.createDayAction(dayId, data)
  revalidatePath('/admin/journeys')
  return result
}

export async function updateDayActionItemAction(
  id: string,
  data: { actionText?: string; reflectionPrompt?: string }
) {
  await requireAdmin()
  const result = await journeyService.updateDayAction(id, data)
  revalidatePath('/admin/journeys')
  return result
}

export async function deleteDayActionItemAction(id: string) {
  await requireAdmin()
  await journeyService.deleteDayAction(id)
  revalidatePath('/admin/journeys')
}

// --- Discussion Prompts ---

export async function listJourneyPromptsAction(journeyId: string) {
  await requireAdmin()
  return communityService.listJourneyPrompts(journeyId)
}

export async function createPromptAction(dayId: string, promptText: string) {
  await requireAdmin()
  const result = await communityService.createPrompt(dayId, promptText)
  revalidatePath('/admin/journeys')
  return result
}

export async function updatePromptAction(
  id: string,
  data: { promptText?: string; isActive?: boolean }
) {
  await requireAdmin()
  const result = await communityService.updatePrompt(id, data)
  revalidatePath('/admin/journeys')
  return result
}

export async function deletePromptAction(id: string) {
  await requireAdmin()
  await communityService.deletePrompt(id)
  revalidatePath('/admin/journeys')
}
