import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { getUserDetail } from '@/lib/services/admin-user.service'

type User = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function computeTotalDays(
  journey: User['userJourneys'][number]['journey']
): number {
  if (journey.estimatedDays) return journey.estimatedDays
  return journey.phases.reduce((sum, phase) => sum + phase._count.days, 0)
}

function computeCurrentDayNumber(
  userJourney: User['userJourneys'][number]
): number | null {
  const { currentDay, journey } = userJourney
  if (!currentDay) return null

  const sortedPhases = [...journey.phases].sort(
    (a, b) => a.position - b.position
  )

  let dayNumber = 0
  for (const phase of sortedPhases) {
    if (phase.position < currentDay.phase.position) {
      dayNumber += phase._count.days
    } else if (phase.position === currentDay.phase.position) {
      dayNumber += currentDay.position
      break
    }
  }

  return dayNumber
}

export function JourneysTab({ user }: { user: User }) {
  const activeJourneys = user.userJourneys.filter(
    (uj) => uj.status === 'ACTIVE'
  )
  const completedJourneys = user.userJourneys.filter(
    (uj) => uj.status === 'COMPLETED'
  )

  if (user.userJourneys.length === 0) {
    return (
      <div className="pt-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-muted-foreground">
              Brugeren har ikke startet nogen forløb.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      {activeJourneys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktive forløb</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeJourneys.map((uj) => {
              const totalDays = computeTotalDays(uj.journey)
              const currentDayNumber = computeCurrentDayNumber(uj)
              const progressPercent =
                currentDayNumber && totalDays > 0
                  ? Math.round((currentDayNumber / totalDays) * 100)
                  : 0

              return (
                <div key={uj.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{uj.journey.title}</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Aktiv
                    </Badge>
                  </div>
                  <Progress value={progressPercent} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {currentDayNumber
                        ? `Dag ${currentDayNumber} af ${totalDays}`
                        : `${totalDays} dage i alt`}
                    </span>
                    <span>Startet {formatDate(uj.startedAt)}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {completedJourneys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gennemførte forløb</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedJourneys.map((uj) => (
              <div
                key={uj.id}
                className="flex items-center justify-between py-1"
              >
                <span className="font-medium">{uj.journey.title}</span>
                <span className="text-sm text-muted-foreground">
                  Gennemført{' '}
                  {uj.completedAt ? formatDate(uj.completedAt) : '–'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
