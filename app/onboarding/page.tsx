import { requireAuth } from '@/lib/auth'
import { getActiveQuestions } from '@/lib/services/onboarding.service'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './_components/onboarding-wizard'

export default async function OnboardingPage() {
  const user = await requireAuth()

  // If user already completed onboarding, go to dashboard
  if (user.onboardingCompleted) {
    redirect('/dashboard')
  }

  const questions = await getActiveQuestions()

  // If no questions configured, skip onboarding
  if (questions.length === 0) {
    redirect('/dashboard')
  }

  return <OnboardingWizard questions={questions} />
}
