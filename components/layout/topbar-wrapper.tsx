import { getTenantConfig } from '@/lib/services/tenant.service'
import { Topbar } from './topbar'

export async function TopbarWrapper() {
  const tenant = await getTenantConfig()
  return (
    <Topbar
      brandName={tenant.brandName}
      logoUrl={tenant.logoUrl}
    />
  )
}
