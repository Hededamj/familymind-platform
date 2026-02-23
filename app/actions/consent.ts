'use server'

import { headers } from 'next/headers'
import { logConsent } from '@/lib/services/consent.service'
import { createClient } from '@/lib/supabase/server'

export async function logConsentAction(data: {
  statistics: boolean
  marketing: boolean
}) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  let userId: string | undefined
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    userId = userData.user?.id
  } catch {
    // Anonymous user — no userId
  }

  await logConsent({
    userId,
    ip,
    statistics: data.statistics,
    marketing: data.marketing,
  })
}
