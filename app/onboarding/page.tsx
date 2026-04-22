import { requireAuth } from '@/lib/auth'
import { getActiveQuestions } from '@/lib/services/onboarding.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './_components/onboarding-wizard'

export default async function OnboardingPage() {
  const user = await requireAuth()

  // If user already completed onboarding, go to dashboard
  if (user.onboardingCompleted) {
    redirect('/dashboard')
  }

  const [questions, tenant] = await Promise.all([
    getActiveQuestions(),
    getTenantConfig(),
  ])

  // No questions configured: mark user as onboarded so the dashboard
  // redirect gate stops bouncing us back here on the next request.
  if (questions.length === 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    })
    redirect('/dashboard')
  }

  return <OnboardingWizard questions={questions} brandName={tenant.brandName} />
}
