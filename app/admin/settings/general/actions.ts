'use server'

import { requireAdmin } from '@/lib/auth'
import { upsertSiteSetting } from '@/lib/services/settings.service'
import { revalidatePath } from 'next/cache'

export async function updateCompanySettingsAction(data: {
  company_name: string
  company_cvr: string
  company_address: string
  company_email: string
}) {
  await requireAdmin()
  await Promise.all([
    upsertSiteSetting('company_name', data.company_name, 'Firmanavn'),
    upsertSiteSetting('company_cvr', data.company_cvr, 'CVR-nummer'),
    upsertSiteSetting('company_address', data.company_address, 'Firmadresse'),
    upsertSiteSetting('company_email', data.company_email, 'Kontakt-email'),
  ])
  revalidatePath('/admin/settings/general')
  revalidatePath('/privatlivspolitik')
  revalidatePath('/cookiepolitik')
  revalidatePath('/vilkaar')
}
