import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from './stat-card'
import { formatDKK } from '@/lib/format-currency'

type OverviewData = {
  activeMembers: { current: number; previous: number }
  churnRate: { current: number; previous: number }
  mrr: { current: number }
  onboardingRate: { current: number; newSignups: number }
  funnel: {
    signup: number
    onboarded: number
    purchased: number
    active: number
    retained30d: number
    eligibleFor30d: number
  }
}

function funnelStep(label: string, count: number, prevCount: number | null) {
  const dropOff = prevCount !== null && prevCount > 0
    ? Math.round(((prevCount - count) / prevCount) * 100)
    : null

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold">{count}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${prevCount && prevCount > 0 ? Math.round((count / prevCount) * 100) : 100}%` }}
          />
        </div>
      </div>
      {dropOff !== null && dropOff > 0 && (
        <span className="shrink-0 text-xs text-red-500">-{dropOff}%</span>
      )}
    </div>
  )
}

export function OverviewTab({ data }: { data: OverviewData }) {
  const f = data.funnel

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktive medlemmer"
          value={String(data.activeMembers.current)}
          trend={data.activeMembers}
          trendLabel=" vs. forrige"
        />
        <StatCard
          title="Churn rate"
          value={`${data.churnRate.current}%`}
          trend={data.churnRate}
          trendLabel=" pp"
          invertTrend
        />
        <StatCard
          title="MRR"
          value={formatDKK(data.mrr.current)}
        />
        <StatCard
          title="Onboarding-rate"
          value={`${data.onboardingRate.current}%`}
          subtitle={`${data.onboardingRate.newSignups} nye signups`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konverteringstragt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelStep('Signup', f.signup, null)}
          {funnelStep('Onboarding gennemført', f.onboarded, f.signup)}
          {funnelStep('Første køb', f.purchased, f.onboarded)}
          {funnelStep('Aktiv bruger', f.active, f.purchased)}
          {funnelStep(`Fastholdt 30d (af ${f.eligibleFor30d})`, f.retained30d, f.eligibleFor30d)}
        </CardContent>
      </Card>
    </div>
  )
}
