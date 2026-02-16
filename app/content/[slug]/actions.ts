'use server'

import { getCurrentUser } from '@/lib/auth'
import { markContentCompleted, markContentStarted } from '@/lib/services/progress.service'
import { revalidatePath } from 'next/cache'

export async function markCompletedAction(contentUnitId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Ikke logget ind')

  await markContentCompleted(user.id, contentUnitId)
  revalidatePath('/dashboard')
}

export async function markStartedAction(contentUnitId: string) {
  const user = await getCurrentUser()
  if (!user) return

  await markContentStarted(user.id, contentUnitId)
}
