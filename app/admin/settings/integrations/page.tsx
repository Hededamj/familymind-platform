import { requireAdmin } from '@/lib/auth'
import { getSiteSettings } from '@/lib/services/settings.service'
import { IntegrationsForm } from './_components/integrations-form'

export default async function IntegrationsSettingsPage() {
  await requireAdmin()

  const settings = await getSiteSettings([
    'ga4_measurement_id',
    'meta_pixel_id',
  ])

  const stripeConnected = !!process.env.STRIPE_SECRET_KEY

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrationer</h1>
        <p className="text-muted-foreground">
          Forbind tredjeparts-tjenester til platformen
        </p>
      </div>
      <IntegrationsForm settings={settings} stripeConnected={stripeConnected} />
    </div>
  )
}
