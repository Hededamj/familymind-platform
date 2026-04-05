'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer } from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

type HealthData = {
  distribution: { trial: number; active: number; inactive: number; churned: number }
  churnTrend: Array<{ week: string; count: number }>
  retentionCohorts: Array<{ month: string; total: number; [key: string]: unknown }>
  leakage: {
    neverOnboarded: number
    onboardedNoPurchase: number
    purchasedNoEngagement: number
    decliningEngagement: number
  }
}

const statusColors: Record<string, string> = {
  trial: 'hsl(var(--muted-foreground))',
  active: 'hsl(142, 76%, 36%)',
  inactive: 'hsl(38, 92%, 50%)',
  churned: 'hsl(0, 84%, 60%)',
}

const statusLabels: Record<string, string> = {
  trial: 'Prøve',
  active: 'Aktiv',
  inactive: 'Inaktiv',
  churned: 'Frafaldne',
}

const pieConfig: ChartConfig = {
  trial: { label: 'Prøve', color: statusColors.trial },
  active: { label: 'Aktiv', color: statusColors.active },
  inactive: { label: 'Inaktiv', color: statusColors.inactive },
  churned: { label: 'Frafaldne', color: statusColors.churned },
}

const churnConfig: ChartConfig = {
  count: { label: 'Opsagte', color: 'hsl(0, 84%, 60%)' },
}

const retentionConfig: ChartConfig = {
  day7: { label: 'Dag 7', color: 'hsl(142, 76%, 36%)' },
  day14: { label: 'Dag 14', color: 'hsl(38, 92%, 50%)' },
  day30: { label: 'Dag 30', color: 'hsl(220, 90%, 56%)' },
  day60: { label: 'Dag 60', color: 'hsl(280, 65%, 60%)' },
  day90: { label: 'Dag 90', color: 'hsl(0, 84%, 60%)' },
}

const leakageRows = [
  { key: 'neverOnboarded' as const, label: 'Aldrig onboardet', desc: 'Signup men ingen quiz', filter: 'onboarding=false' },
  { key: 'onboardedNoPurchase' as const, label: 'Onboardet, aldrig købt', desc: 'Quiz færdig, intet køb', filter: 'status=TRIAL' },
  { key: 'purchasedNoEngagement' as const, label: 'Købt, aldrig engageret', desc: 'Abonnement men 0 indhold set', filter: 'status=INACTIVE' },
  { key: 'decliningEngagement' as const, label: 'Faldende engagement', desc: 'Var aktiv, nu >10 dage inaktiv', filter: 'status=INACTIVE' },
]

export function HealthTab({ data }: { data: HealthData }) {
  const pieData = Object.entries(data.distribution)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: statusLabels[key], value, fill: statusColors[key] }))

  const total = Object.values(data.distribution).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Status distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medlemsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="mx-auto h-[250px]">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {Object.entries(data.distribution).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="size-3 rounded-full" style={{ backgroundColor: statusColors[key] }} />
                  <span className="text-muted-foreground">{statusLabels[key]}</span>
                  <span className="font-medium">{value}</span>
                  <span className="text-muted-foreground">({total > 0 ? Math.round((value / total) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Churn trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Churn-trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.churnTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Ingen data i perioden</p>
            ) : (
              <ChartContainer config={churnConfig} className="h-[250px]">
                <BarChart data={data.churnTrend}>
                  <XAxis dataKey="week" tickFormatter={(v) => v.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retention cohorts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention per kohorte</CardTitle>
        </CardHeader>
        <CardContent>
          {data.retentionCohorts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Ingen kohorte-data endnu</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kohorte</TableHead>
                    <TableHead className="text-right">Brugere</TableHead>
                    <TableHead className="text-right">7d</TableHead>
                    <TableHead className="text-right">14d</TableHead>
                    <TableHead className="text-right">30d</TableHead>
                    <TableHead className="text-right">60d</TableHead>
                    <TableHead className="text-right">90d</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.retentionCohorts.map((c) => (
                    <TableRow key={c.month}>
                      <TableCell className="font-medium">{c.month}</TableCell>
                      <TableCell className="text-right">{c.total}</TableCell>
                      {['day7', 'day14', 'day30', 'day60', 'day90'].map((key) => (
                        <TableCell key={key} className="text-right">
                          {(c[key] as number) ?? 0}%
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leakage report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lækage-rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead className="text-right">Antal</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leakageRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.desc}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={data.leakage[row.key] > 0 ? 'destructive' : 'secondary'}>
                        {data.leakage[row.key]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users?${row.filter}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
