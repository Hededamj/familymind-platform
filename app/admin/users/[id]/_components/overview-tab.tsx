import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { getUserDetail, getUserActivity } from '@/lib/services/admin-user.service'

type User = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>
type Activity = Awaited<ReturnType<typeof getUserActivity>>

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRelativeTime(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Lige nu'
  if (minutes < 60) return `${minutes} min siden`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} timer siden`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} dage siden`

  return formatDate(date)
}

const activityDotColors: Record<string, string> = {
  journey_start: 'bg-blue-500',
  check_in: 'bg-green-500',
  post: 'bg-purple-500',
  reply: 'bg-gray-400',
}

export function OverviewTab({
  user,
  activity,
}: {
  user: User
  activity: Activity
}) {
  const activeSubscription = user.entitlements.find(
    (e) =>
      e.status === 'ACTIVE' &&
      e.source === 'SUBSCRIPTION' &&
      (!e.expiresAt || new Date(e.expiresAt) > new Date())
  )

  const activeJourneys = user.userJourneys.filter(
    (uj) => uj.status === 'ACTIVE'
  )

  const totalCheckIns = user.userJourneys.reduce(
    (sum, uj) => sum + uj._count.checkIns,
    0
  )

  return (
    <div className="space-y-6 pt-4">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abonnement</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSubscription ? (
              <div>
                <CardTitle className="text-lg">
                  {activeSubscription.product.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  DKK{' '}
                  {(activeSubscription.product.priceAmountCents / 100).toFixed(
                    0
                  )}
                  /md
                </p>
                <p className="text-sm text-muted-foreground">
                  Siden {formatDate(activeSubscription.createdAt)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Intet aktivt abonnement
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-semibold">{activeJourneys.length}</span>{' '}
                forløb aktive
              </p>
              <p className="text-sm">
                <span className="font-semibold">{totalCheckIns}</span> check-ins
              </p>
              <p className="text-sm">
                <span className="font-semibold">
                  {user._count.discussionPosts}
                </span>{' '}
                community-indlæg
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitet</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen aktivitet registreret.
            </p>
          ) : (
            <div className="space-y-4">
              {activity.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1.5 flex-shrink-0">
                    <div
                      className={`size-2.5 rounded-full ${activityDotColors[item.type] ?? 'bg-gray-400'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
