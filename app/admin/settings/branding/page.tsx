import { requireAdmin } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandingForm } from './_components/branding-form'

export default async function BrandingSettingsPage() {
  await requireAdmin()
  const tenant = await getTenantConfig()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Branding
          </h1>
          <p className="text-muted-foreground">
            Tilpas brandnavn, farver, tekster og visuel identitet
          </p>
        </div>
      </div>

      <Separator />

      <BrandingForm tenant={tenant} />
    </div>
  )
}
