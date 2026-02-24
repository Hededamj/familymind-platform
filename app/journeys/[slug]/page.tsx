import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check, CircleDot, Circle, ArrowLeft, Users, Lock } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { trackActivity } from '@/lib/track-activity'
import { getJourney, getUserActiveJourney, getJourneyProgress } from '@/lib/services/journey.service'
import { getUserCohort } from '@/lib/services/community.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StartJourneyButton } from './_components/start-journey-button'

export default async function JourneyOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await requireAuth()
  trackActivity() // fire-and-forget, no await
  const journey = await getJourney(slug)

  if (!journey || !journey.isActive) {
    notFound()
  }

  const activeJourney = await getUserActiveJourney(user.id)
  const isActiveForThisJourney =
    activeJourney && activeJourney.journeyId === journey.id

  const progress = isActiveForThisJourney
    ? await getJourneyProgress(activeJourney.id)
    : null

  const cohortMembership = isActiveForThisJourney
    ? await getUserCohort(user.id, journey.id)
    : null

  const allDays = journey.phases.flatMap((p) => p.days)
  const totalDays = allDays.length

  const completedDayIds = new Set(
    progress?.phases.flatMap((p) => p.days.filter((d) => d.completed).map((d) => d.id)) ?? []
  )
  const currentDayId = isActiveForThisJourney ? activeJourney.currentDayId : null

  // Calculate which days are accessible (completed + current)
  const currentDayIndex = currentDayId ? allDays.findIndex((d) => d.id === currentDayId) : -1

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage
        </Link>

        {/* Journey header */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-primary">
            Forløb &middot; {totalDays} dage
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl">
            {journey.title}
          </h1>
          {journey.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{journey.description}</p>
          )}
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mb-6 rounded-2xl border border-border bg-white p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                Dag {progress.currentDayNumber} af {progress.totalDays}
              </span>
              <span className="text-muted-foreground">
                {progress.percentComplete}%
              </span>
            </div>
            <Progress value={progress.percentComplete} className="h-2" />
          </div>
        )}

        {/* Community link */}
        {cohortMembership && (
          <Link
            href={`/journeys/${slug}/community`}
            className="mb-6 flex items-center justify-between rounded-2xl bg-sand p-5 transition-colors hover:bg-sand-dark"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Fællesskab</p>
                <p className="text-xs text-muted-foreground">
                  {cohortMembership.cohort._count.members} medlemmer
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        )}

        {/* Phases and days */}
        <div className="space-y-6">
          {journey.phases.map((phase, phaseIndex) => (
            <div key={phase.id}>
              {/* Phase header */}
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {phaseIndex + 1}
                </span>
                <h2 className="font-serif text-lg">{phase.title}</h2>
              </div>

              {/* Days */}
              <div className="space-y-2">
                {phase.days.map((day) => {
                  const isCompleted = completedDayIds.has(day.id)
                  const isCurrent = day.id === currentDayId
                  const dayIndex = allDays.findIndex((d) => d.id === day.id)
                  const isLocked = currentDayIndex >= 0 && dayIndex > currentDayIndex && !isCompleted

                  return (
                    <div
                      key={day.id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                        isCurrent
                          ? 'border border-primary/30 bg-primary/5'
                          : isCompleted
                            ? 'bg-success-light'
                            : isLocked
                              ? 'bg-muted/30 opacity-60'
                              : 'bg-sand/50'
                      }`}
                    >
                      {/* Status icon */}
                      {isCompleted ? (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
                          <Check className="size-3.5" />
                        </div>
                      ) : isCurrent ? (
                        <CircleDot className="size-6 shrink-0 text-primary" />
                      ) : isLocked ? (
                        <Lock className="size-5 shrink-0 text-muted-foreground/40" />
                      ) : (
                        <Circle className="size-6 shrink-0 text-muted-foreground/40" />
                      )}

                      {/* Day info */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${
                          isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                        }`}>
                          {day.title || `Dag ${phaseIndex + 1}.${day.position}`}
                        </p>
                      </div>

                      {/* CTA badges */}
                      {isCurrent && (
                        <Link href={`/journeys/${slug}/day/${day.id}`}>
                          <Badge className="cursor-pointer rounded-full whitespace-nowrap">
                            Fortsæt
                            <ArrowRight className="ml-1 size-3" />
                          </Badge>
                        </Link>
                      )}
                      {isCompleted && (
                        <Link href={`/journeys/${slug}/day/${day.id}`}>
                          <Badge variant="outline" className="cursor-pointer rounded-full whitespace-nowrap text-success">
                            Se igen
                          </Badge>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8">
          {!isActiveForThisJourney && !activeJourney && (
            <StartJourneyButton journeyId={journey.id} journeySlug={slug} />
          )}

          {!isActiveForThisJourney && activeJourney && (
            <div className="rounded-2xl border border-border bg-white p-6 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Du har allerede et aktivt forløb:
              </p>
              <p className="mb-4 font-serif text-lg">{activeJourney.journey.title}</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/journeys/${activeJourney.journey.slug}`}>
                  Gå til aktivt forløb
                </Link>
              </Button>
            </div>
          )}

          {isActiveForThisJourney && currentDayId && (
            <Button asChild size="lg" className="w-full rounded-xl">
              <Link href={`/journeys/${slug}/day/${currentDayId}`}>
                Fortsæt med dag {progress?.currentDayNumber}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
