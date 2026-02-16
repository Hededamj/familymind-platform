import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OnboardingManager } from './_components/onboarding-manager'

export default async function OnboardingSettingsPage() {
  await requireAdmin()

  const questions = await prisma.onboardingQuestion.findMany({
    include: {
      options: {
        include: { tag: true },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { position: 'asc' },
  })

  const tags = await prisma.contentTag.findMany({
    orderBy: { name: 'asc' },
  })

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
            Onboarding Quiz
          </h1>
          <p className="text-muted-foreground">
            Konfigurer spoergsmaal og svarmuligheder til onboarding-quizzen
          </p>
        </div>
      </div>

      <Separator />

      <OnboardingManager questions={questions} tags={tags} />
    </div>
  )
}
