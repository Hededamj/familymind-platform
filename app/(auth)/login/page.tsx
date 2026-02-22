import { getTenantConfig } from '@/lib/services/tenant.service'
import { LoginForm } from './_components/login-form'

export default async function LoginPage() {
  const tenant = await getTenantConfig()
  return <LoginForm brandName={tenant.brandName} />
}
