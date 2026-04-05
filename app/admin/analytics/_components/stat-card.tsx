import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string
  subtitle?: string
  trend?: { current: number; previous: number }
  trendLabel?: string
}

export function StatCard({ title, value, subtitle, trend, trendLabel }: StatCardProps) {
  const diff = trend ? trend.current - trend.previous : 0
  const isUp = diff > 0
  const isDown = diff < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-muted-foreground'}`}>
            {isUp ? <TrendingUp className="size-3" /> : isDown ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
            {isUp ? '+' : ''}{diff}{trendLabel ?? ''}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
