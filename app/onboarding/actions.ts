'use server'

import { requireAuth } from '@/lib/auth'
import { saveOnboardingProfile } from '@/lib/services/onboarding.service'
import { redirect } from 'next/navigation'

export async function submitOnboarding(data: {
  responses: Array<{ questionId: string; selectedOptionIds: string[] }>
}) {
  const user = await requireAuth()

  await saveOnboardingProfile(user.id, {
    responses: data.responses,
  })

  redirect('/dashboard')
}
