import { requireAdmin } from '@/lib/auth'
import { getSiteSettings } from '@/lib/services/settings.service'
import { CompanySettingsForm } from './_components/company-settings-form'

export default async function GeneralSettingsPage() {
  await requireAdmin()

  const settings = await getSiteSettings([
    'company_name',
    'company_cvr',
    'company_address',
    'company_email',
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generelt</h1>
        <p className="text-muted-foreground">
          Firmaoplysninger der vises i juridiske dokumenter
        </p>
      </div>
      <CompanySettingsForm settings={settings} />
    </div>
  )
}
