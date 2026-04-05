import Link from 'next/link'
import {
  CalendarDays,
  BookOpen,
  CheckCircle2,
  Trophy,
  Flame,
  TrendingUp,
  Star,
  ArrowLeft,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getProgressHistory } from '@/lib/services/engagement.service'
import { Badge } from '@/components/ui/badge'

export default async function ProgressPage() {
  const user = await requireAuth()
  const { allTime, milestones, monthlyBreakdown } = await getProgressHistory(
    user.id
  )

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage
        </Link>

        <h1 className="mb-1 font-serif text-2xl sm:text-3xl">
          Din fremgang
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Du er på en fantastisk rejse, {displayName}
        </p>

        {/* All-time stats grid */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <StatCard
            icon={<CalendarDays className="size-5" />}
            iconBg="bg-primary/10 text-primary"
            label="Aktive dage"
            value={allTime.daysActive}
          />
          <StatCard
            icon={<BookOpen className="size-5" />}
            iconBg="bg-success-light text-success"
            label="Indhold set"
            value={allTime.contentConsumed}
          />
          <StatCard
            icon={<CheckCircle2 className="size-5" />}
            iconBg="bg-purple-50 text-purple-500"
            label="Check-ins"
            value={allTime.checkInsCompleted}
          />
          <StatCard
            icon={<Trophy className="size-5" />}
            iconBg="bg-amber-50 text-amber-500"
            label="Forløb fuldført"
            value={allTime.journeysCompleted}
          />
          <StatCard
            icon={<Flame className="size-5" />}
            iconBg="bg-orange-50 text-orange-500"
            label="Streak"
            value={allTime.currentStreak}
            suffix={allTime.currentStreak === 1 ? 'dag' : 'dage'}
          />
          <StatCard
            icon={<Star className="size-5" />}
            iconBg="bg-yellow-50 text-yellow-500"
            label="Milepæle"
            value={milestones.length}
          />
        </div>

        {/* Milestones */}
        <div className="mb-8">
          <h2 className="mb-4 font-serif text-lg sm:text-xl">Milepæle</h2>
          {milestones.length === 0 ? (
            <div className="rounded-2xl bg-sand p-6 text-center">
              <Trophy className="mx-auto mb-2 size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Bliv ved med at være aktiv — dine milepæle kommer snart!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 overflow-hidden rounded-2xl border border-border bg-white p-5"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <Star className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{milestone.celebrationTitle}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {milestone.celebrationMessage}
                    </p>
                    <p className="mt-1 text-xs text-warm-gray">
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
        </div>

        {/* Monthly breakdown */}
        <div>
          <h2 className="mb-4 font-serif text-lg sm:text-xl">Månedlig aktivitet</h2>
          {monthlyBreakdown.length === 0 ? (
            <div className="rounded-2xl bg-sand p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ingen data endnu.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyBreakdown.map((month) => (
                <div
                  key={month.month}
                  className="rounded-2xl border border-border bg-white p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">{formatMonth(month.month)}</h3>
                    {month.daysActive > 0 && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {month.daysActive} aktive dage
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-sand px-3 py-3">
                      <p className="text-xl font-semibold">{month.contentConsumed}</p>
                      <p className="text-xs text-muted-foreground">Indhold</p>
                    </div>
                    <div className="rounded-xl bg-sand px-3 py-3">
                      <p className="text-xl font-semibold">{month.checkInsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Check-ins</p>
                    </div>
                    <div className="rounded-xl bg-sand px-3 py-3">
                      <p className="text-xl font-semibold">{month.daysActive}</p>
                      <p className="text-xs text-muted-foreground">Dage aktiv</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: number
  suffix?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-center">
      <div className={`mx-auto mb-2 flex size-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold">
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'long',
  })
}
