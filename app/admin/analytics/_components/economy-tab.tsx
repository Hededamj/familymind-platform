'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis } from 'recharts'
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

const mrrConfig: ChartConfig = {
  total: { label: 'MRR', color: 'hsl(220, 90%, 56%)' },
}

const productConfig: ChartConfig = {
  revenue: { label: 'Omsætning', color: 'hsl(142, 76%, 36%)' },
}

export function EconomyTab({ data }: { data: EconomyData }) {
  return (
    <div className="space-y-6">
      {/* MRR cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="MRR"
          value={formatDKK(data.mrr.current)}
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
            <div className={`text-2xl font-bold ${data.mrr.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.mrr.net >= 0 ? '+' : ''}{formatDKK(data.mrr.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* MRR trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRR-trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.mrrTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Ingen data i perioden</p>
            ) : (
              <ChartContainer config={mrrConfig} className="h-[250px]">
                <AreaChart data={data.mrrTrend}>
                  <XAxis dataKey="week" tickFormatter={(v) => v.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 100)}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue per product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Omsætning per produkt</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenuePerProduct.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Ingen salg i perioden</p>
            ) : (
              <ChartContainer config={productConfig} className="h-[250px]">
                <BarChart data={data.revenuePerProduct} layout="vertical">
                  <XAxis type="number" fontSize={12} tickFormatter={(v) => `${Math.round(v / 100)}`} />
                  <YAxis type="category" dataKey="title" fontSize={12} width={120} tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Gennemsnitlig LTV"
          value={formatDKK(data.keyMetrics.avgLtv)}
          subtitle="Total omsætning / betalende brugere"
        />
        <StatCard
          title="Gennemsnitlig levetid"
          value={data.keyMetrics.medianLifetimeDays !== null ? `${data.keyMetrics.medianLifetimeDays} dage` : 'Ingen data'}
          subtitle="Median dage fra køb til churn"
        />
        <StatCard
          title="Revenue per aktiv bruger"
          value={formatDKK(data.keyMetrics.revenuePerUser)}
          subtitle="MRR / aktive brugere"
        />
      </div>
    </div>
  )
}
