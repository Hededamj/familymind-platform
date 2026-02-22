import { getTenantConfig } from '@/lib/services/tenant.service'
import { SignupForm } from './_components/signup-form'

export default async function SignupPage() {
  const tenant = await getTenantConfig()
  return <SignupForm brandName={tenant.brandName} />
}
