'use server'

import { requireAdmin } from '@/lib/auth'
import { upsertSiteSetting } from '@/lib/services/settings.service'
import { revalidatePath } from 'next/cache'
import { updateCompanySettingsSchema } from '@/lib/validators/settings'

export async function updateCompanySettingsAction(data: {
  company_name: string
  company_cvr: string
  company_address: string
  company_email: string
}) {
  await requireAdmin()
  const valid = updateCompanySettingsSchema.parse(data)
  await Promise.all([
    upsertSiteSetting('company_name', valid.company_name, 'Firmanavn'),
    upsertSiteSetting('company_cvr', valid.company_cvr, 'CVR-nummer'),
    upsertSiteSetting('company_address', valid.company_address, 'Firmadresse'),
    upsertSiteSetting('company_email', valid.company_email, 'Kontakt-email'),
  ])
  revalidatePath('/admin/settings/general')
  revalidatePath('/privatlivspolitik')
  revalidatePath('/cookiepolitik')
  revalidatePath('/vilkaar')
}
