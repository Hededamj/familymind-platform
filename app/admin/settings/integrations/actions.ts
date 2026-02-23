'use server'

import { requireAdmin } from '@/lib/auth'
import { upsertSiteSetting } from '@/lib/services/settings.service'
import { revalidatePath } from 'next/cache'

export async function updateIntegrationSettingsAction(data: {
  ga4_measurement_id: string
  meta_pixel_id: string
}) {
  await requireAdmin()
  await Promise.all([
    upsertSiteSetting('ga4_measurement_id', data.ga4_measurement_id, 'Google Analytics 4 Measurement ID'),
    upsertSiteSetting('meta_pixel_id', data.meta_pixel_id, 'Meta (Facebook) Pixel ID'),
  ])
  revalidatePath('/admin/settings/integrations')
}
