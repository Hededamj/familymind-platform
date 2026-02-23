'use server'

import { requireAdmin } from '@/lib/auth'
import { upsertSiteSetting } from '@/lib/services/settings.service'
import { revalidatePath, revalidateTag } from 'next/cache'

const GA4_PATTERN = /^G-[A-Z0-9]{6,12}$/
const META_PIXEL_PATTERN = /^\d{10,20}$/

export async function updateIntegrationSettingsAction(data: {
  ga4_measurement_id: string
  meta_pixel_id: string
}) {
  await requireAdmin()

  if (data.ga4_measurement_id && !GA4_PATTERN.test(data.ga4_measurement_id)) {
    throw new Error('Ugyldigt GA4 Measurement ID format (forventet: G-XXXXXXXXXX)')
  }
  if (data.meta_pixel_id && !META_PIXEL_PATTERN.test(data.meta_pixel_id)) {
    throw new Error('Ugyldigt Meta Pixel ID format (forventet: 10-20 cifre)')
  }

  await Promise.all([
    upsertSiteSetting('ga4_measurement_id', data.ga4_measurement_id, 'Google Analytics 4 Measurement ID'),
    upsertSiteSetting('meta_pixel_id', data.meta_pixel_id, 'Meta (Facebook) Pixel ID'),
  ])
  revalidatePath('/admin/settings/integrations')
  revalidateTag('analytics-settings', 'default')
}
