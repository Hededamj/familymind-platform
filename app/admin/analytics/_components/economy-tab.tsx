'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from './stat-card'
import { formatDKK } from '@/lib/format-currency'

type EconomyData = {
  mrr: { current: number; new: number; lost: number; net: number }
  mrrTrend: Array<{ week: string; total: number }>
  revenuePerProduct: Array<{ title: string; revenue: number }>
  keyMetrics: {
    avgLtv: number
    medianLifetimeDays: number | null
    revenuePerUser: number
  }
}

export function EconomyTab({ data }: { data: EconomyData }) {
  const topRevenue = data.revenuePerProduct.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* MRR cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="MRR"
          value={formatDKK(data.mrr.current)}
          subtitle="Aktive abonnementer"
        />
        <StatCard
          title="Ny MRR"
          value={formatDKK(data.mrr.new)}
          subtitle="Nye abonnementer i perioden"
        />
        <StatCard
          title="Mistet MRR"
          value={formatDKK(data.mrr.lost)}
          subtitle="Opsagte i perioden"
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Netto MRR-ændring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.mrr.net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.mrr.net >= 0 ? '+' : ''}
              {formatDKK(data.mrr.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top sælgere */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top sælgere</CardTitle>
        </CardHeader>
        <CardContent>
          {topRevenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ingen omsætning i perioden
            </p>
          ) : (
            <div className="space-y-2">
              {topRevenue.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-border py-2 last:border-0"
                >
                  <span className="text-sm">{item.title}</span>
                  <span className="text-sm font-semibold">
                    {formatDKK(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export default EconomyTab
