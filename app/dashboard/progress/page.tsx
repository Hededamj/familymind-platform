import Link from 'next/link'
import {
  CalendarDays,
  BookOpen,
  CheckCircle2,
  Trophy,
  Flame,
  TrendingUp,
  Star,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getProgressHistory } from '@/lib/services/engagement.service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default async function ProgressPage() {
  const user = await requireAuth()
  const { allTime, milestones, monthlyBreakdown } = await getProgressHistory(
    user.id
  )

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Tilbage til dashboard
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Din fremgang
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Se hvor langt du er kommet, {displayName}
        </p>

        {/* All-time stats grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<CalendarDays className="size-5 text-blue-500" />}
            label="Aktive dage"
            value={allTime.daysActive}
          />
          <StatCard
            icon={<BookOpen className="size-5 text-green-500" />}
            label="Indhold gennemgået"
            value={allTime.contentConsumed}
          />
          <StatCard
            icon={<CheckCircle2 className="size-5 text-purple-500" />}
            label="Check-ins"
            value={allTime.checkInsCompleted}
          />
          <StatCard
            icon={<Trophy className="size-5 text-amber-500" />}
            label="Forløb gennemført"
            value={allTime.journeysCompleted}
          />
          <StatCard
            icon={<Flame className="size-5 text-orange-500" />}
            label="Nuværende streak"
            value={allTime.currentStreak}
            suffix={allTime.currentStreak === 1 ? 'dag' : 'dage'}
          />
          <StatCard
            icon={<Star className="size-5 text-yellow-500" />}
            label="Milepæle opnået"
            value={milestones.length}
          />
        </div>

        {/* Milestones */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              Milepæle
            </CardTitle>
            <CardDescription>
              Dine opnåede milepæle og fejringer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Du har endnu ikke opnået nogen milepæle. Bliv ved med at
                være aktiv, så kommer de!
              </p>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <Star className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {milestone.celebrationTitle}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {milestone.name}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {milestone.celebrationMessage}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Opnået{' '}
                        {milestone.earnedAt.toLocaleDateString('da-DK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-500" />
              Månedlig oversigt
            </CardTitle>
            <CardDescription>
              Din aktivitet de seneste 6 måneder
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyBreakdown.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Ingen data endnu.
              </p>
            ) : (
              <div className="space-y-4">
                {monthlyBreakdown.map((month) => (
                  <div key={month.month}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium">
                        {formatMonth(month.month)}
                      </h3>
                      {month.daysActive > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {month.daysActive} aktive dage
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/50 px-3 py-2">
                        <p className="text-lg font-bold">
                          {month.contentConsumed}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Indhold
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/50 px-3 py-2">
                        <p className="text-lg font-bold">
                          {month.checkInsCompleted}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Check-ins
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/50 px-3 py-2">
                        <p className="text-lg font-bold">
                          {month.daysActive}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dage aktiv
                        </p>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-3 py-4 text-center">
        <div className="mb-2">{icon}</div>
        <p className="text-2xl font-bold">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Format YYYY-MM to a Danish month name.
 */
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
  })
}
