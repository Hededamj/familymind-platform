'use server'

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { requireAdmin } from '@/lib/auth'
import { upsertSiteSetting } from '@/lib/services/settings.service'
import {
  generateConnectOAuthUrl,
  disconnectStripeAccount,
} from '@/lib/services/stripe-connect.service'
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

export async function initiateStripeConnectAction() {
  const user = await requireAdmin()

  if (!user.organizationId) {
    redirect('/admin/settings/integrations?connect_error=Bruger+tilh%C3%B8rer+ingen+organisation')
  }

  // Tjek miljøvariabler før vi prøver at generere URL
  if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
    redirect('/admin/settings/integrations?connect_error=Stripe+er+ikke+konfigureret+endnu+(STRIPE_CONNECT_CLIENT_ID+mangler).+Kontakt+udvikleren.')
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    redirect('/admin/settings/integrations?connect_error=NEXT_PUBLIC_APP_URL+er+ikke+sat+i+miljøet')
  }

  // Generér CSRF-token og gem i cookie
  const state = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('stripe_connect_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutter
    path: '/',
  })

  const url = generateConnectOAuthUrl(state)
  redirect(url)
}

export async function disconnectStripeAction() {
  const user = await requireAdmin()

  if (!user.organizationId) {
    throw new Error('Bruger tilhører ingen organisation')
  }

  await disconnectStripeAccount(user.organizationId)
  revalidatePath('/admin/settings/integrations')
}
