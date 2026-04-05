'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis } from 'recharts'
import { StatCard } from './stat-card'

type ConversionData = {
  funnel: {
    signup: number
    onboarded: number
    purchased: number
    active: number
    retained30d: number
    eligibleFor30d: number
  }
  conversionOverTime: Array<{ week: string; rate: number }>
  timeToConversion: {
    onboardingDays: number | null
    purchaseDays: number | null
  }
}

const rateConfig: ChartConfig = {
  rate: { label: 'Konverteringsrate', color: 'hsl(220, 90%, 56%)' },
}

function funnelBar(label: string, count: number, total: number, prevCount: number | null) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const dropOff = prevCount !== null && prevCount > 0
    ? Math.round(((prevCount - count) / prevCount) * 100)
    : null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{count}</span>
          {dropOff !== null && dropOff > 0 && (
            <span className="text-xs text-red-500">-{dropOff}%</span>
          )}
        </div>
      </div>
      <div className="h-8 rounded-lg bg-muted overflow-hidden">
        <div
          className="flex h-full items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-all"
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          {pct}%
        </div>
      </div>
    </div>
  )
}

export function ConversionTab({ data }: { data: ConversionData }) {
  const f = data.funnel
  const total = f.signup

  return (
    <div className="space-y-6">
      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konverteringstragt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelBar('Signup', f.signup, total, null)}
          {funnelBar('Onboarding gennemført', f.onboarded, total, f.signup)}
          {funnelBar('Første køb', f.purchased, total, f.onboarded)}
          {funnelBar('Aktiv bruger', f.active, total, f.purchased)}
          {funnelBar(`Fastholdt 30d (af ${f.eligibleFor30d})`, f.retained30d, f.eligibleFor30d > 0 ? f.eligibleFor30d : total, f.eligibleFor30d > 0 ? f.eligibleFor30d : f.active)}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion rate over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signup → køb rate over tid</CardTitle>
          </CardHeader>
          <CardContent>
            {data.conversionOverTime.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Ingen data i perioden</p>
            ) : (
              <ChartContainer config={rateConfig} className="h-[250px]">
                <LineChart data={data.conversionOverTime}>
                  <XAxis dataKey="week" tickFormatter={(v) => v.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} unit="%" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="rate" stroke="var(--color-rate)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Time to conversion */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            title="Tid til onboarding"
            value={data.timeToConversion.onboardingDays !== null ? `${data.timeToConversion.onboardingDays} dage` : 'Ingen data'}
            subtitle="Median fra signup til quiz gennemført"
          />
          <StatCard
            title="Tid til første køb"
            value={data.timeToConversion.purchaseDays !== null ? `${data.timeToConversion.purchaseDays} dage` : 'Ingen data'}
            subtitle="Median fra signup til betaling"
          />
        </div>
      </div>
    </div>
  )
}
