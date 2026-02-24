import { Suspense } from 'react'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { LoginForm } from './_components/login-form'

export default async function LoginPage() {
  const tenant = await getTenantConfig()
  return (
    <Suspense>
      <LoginForm brandName={tenant.brandName} />
    </Suspense>
  )
}
