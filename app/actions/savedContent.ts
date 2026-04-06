'use server'

import { requireAuth } from '@/lib/auth'
import { bookmarkLesson, unbookmarkLesson } from '@/lib/services/savedContent.service'

export async function toggleBookmarkAction(contentUnitId: string, currentlySaved: boolean) {
  const user = await requireAuth()
  if (currentlySaved) {
    await unbookmarkLesson(user.id, contentUnitId)
  } else {
    await bookmarkLesson(user.id, contentUnitId)
  }
}
