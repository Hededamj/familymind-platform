import { getTenantConfig } from '@/lib/services/tenant.service'
import { Footer } from './footer'

export async function FooterWrapper() {
  const tenant = await getTenantConfig()
  return (
    <Footer
      brandName={tenant.brandName}
      description={tenant.description}
      contactUrl={tenant.contactUrl}
      footerCopyright={tenant.footerCopyright}
      footerLinks={tenant.footerLinks}
    />
  )
}
