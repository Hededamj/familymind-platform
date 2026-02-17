import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check, CircleDot, Circle, ArrowLeft } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getJourney, getUserActiveJourney, getJourneyProgress } from '@/lib/services/journey.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const journey = await getJourney(slug)

  if (!journey || !journey.isActive) {
    notFound()
  }

  // Check if user has an active journey for THIS journey
  const activeJourney = await getUserActiveJourney(user.id)
  const isActiveForThisJourney =
    activeJourney && activeJourney.journeyId === journey.id

  // Get progress if the user has this journey active
  const progress = isActiveForThisJourney
    ? await getJourneyProgress(activeJourney.id)
    : null

  // Flatten all days to compute total and find current
  const allDays = journey.phases.flatMap((p) => p.days)
  const totalDays = allDays.length

  // Build a set of completed day IDs for highlighting
  const completedDayIds = new Set(
    progress?.phases.flatMap((p) => p.days.filter((d) => d.completed).map((d) => d.id)) ?? []
  )
  const currentDayId = isActiveForThisJourney ? activeJourney.currentDayId : null

  return (
    <div className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage til dashboard
        </Link>

        {/* Journey header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {journey.title}
          </h1>
          {journey.description && (
            <p className="mt-2 text-muted-foreground">{journey.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {journey.estimatedDays && (
              <Badge variant="secondary">{journey.estimatedDays} dage</Badge>
            )}
            <Badge variant="secondary">
              {journey.phases.length} {journey.phases.length === 1 ? 'fase' : 'faser'}
            </Badge>
            <Badge variant="secondary">{totalDays} dage i alt</Badge>
          </div>
        </div>

        {/* Progress bar (only if active) */}
        {progress && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  Dag {progress.currentDayNumber} af {progress.totalDays}
                </span>
                <span className="text-muted-foreground">
                  {progress.percentComplete}% gennemført
                </span>
              </div>
              <Progress value={progress.percentComplete} className="h-3" />
            </CardContent>
          </Card>
        )}

        {/* Phases and days */}
        <div className="space-y-6">
          {journey.phases.map((phase, phaseIndex) => (
            <Card key={phase.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {phaseIndex + 1}
                  </span>
                  {phase.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {phase.days.map((day) => {
                    const isCompleted = completedDayIds.has(day.id)
                    const isCurrent = day.id === currentDayId

                    return (
                      <div
                        key={day.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                          isCurrent
                            ? 'border border-primary/30 bg-primary/5'
                            : isCompleted
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : 'bg-muted/50'
                        }`}
                      >
                        {/* Status icon */}
                        {isCompleted ? (
                          <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                            <Check className="size-3.5" />
                          </div>
                        ) : isCurrent ? (
                          <CircleDot className="size-6 flex-shrink-0 text-primary" />
                        ) : (
                          <Circle className="size-6 flex-shrink-0 text-muted-foreground/40" />
                        )}

                        {/* Day info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isCurrent
                                ? 'text-primary'
                                : isCompleted
                                  ? 'text-green-700 dark:text-green-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {day.title || `Dag ${phaseIndex + 1}.${day.position}`}
                          </p>
                        </div>

                        {/* Current day CTA */}
                        {isCurrent && (
                          <Link href={`/journeys/${slug}/day/${day.id}`}>
                            <Badge
                              variant="default"
                              className="cursor-pointer whitespace-nowrap"
                            >
                              Fortsæt
                              <ArrowRight className="ml-1 size-3" />
                            </Badge>
                          </Link>
                        )}

                        {/* Completed day - allow revisiting */}
                        {isCompleted && (
                          <Link href={`/journeys/${slug}/day/${day.id}`}>
                            <Badge
                              variant="outline"
                              className="cursor-pointer whitespace-nowrap text-green-700 dark:text-green-400"
                            >
                              Se igen
                            </Badge>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8">
          {!isActiveForThisJourney && !activeJourney && (
            <StartJourneyButton
              journeyId={journey.id}
              journeySlug={slug}
            />
          )}

          {!isActiveForThisJourney && activeJourney && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="mb-2 text-sm text-muted-foreground">
                  Du har allerede et aktivt forløb:
                </p>
                <p className="mb-4 font-medium">{activeJourney.journey.title}</p>
                <Button asChild variant="outline">
                  <Link href={`/journeys/${activeJourney.journey.slug}`}>
                    Gå til aktivt forløb
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isActiveForThisJourney && currentDayId && (
            <Button asChild size="lg" className="w-full">
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
