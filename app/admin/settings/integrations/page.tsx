import { requireAdmin } from '@/lib/auth'
import { getSiteSettings } from '@/lib/services/settings.service'
import { prisma } from '@/lib/prisma'
import { IntegrationsForm } from './_components/integrations-form'
import { StripeConnectCard } from './_components/stripe-connect-card'

export default async function IntegrationsSettingsPage() {
  const user = await requireAdmin()

  const settings = await getSiteSettings([
    'ga4_measurement_id',
    'meta_pixel_id',
  ])

  // Hent org Stripe Connect-status
  let stripeConnect = {
    status: 'not_connected' as string,
    accountId: null as string | null,
  }

  if (user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    })
    if (org) {
      stripeConnect = {
        status: org.stripeAccountStatus,
        accountId: org.stripeAccountId,
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrationer</h1>
        <p className="text-muted-foreground">
          Forbind tredjeparts-tjenester til platformen
        </p>
      </div>
      <StripeConnectCard
        status={stripeConnect.status}
        accountId={stripeConnect.accountId}
      />
      <IntegrationsForm settings={settings} />
    </div>
  )
}
