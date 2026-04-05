import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import {
  getOverviewStats,
  getHealthStats,
  getConversionStats,
  getEconomyStats,
  getBehaviorStats,
} from '@/lib/services/analytics.service'
import { AnalyticsTabs } from './_components/analytics-tabs'
import { PeriodSelector } from './_components/period-selector'
import { OverviewTab } from './_components/overview-tab'
import { HealthTab } from './_components/health-tab'
import { ConversionTab } from './_components/conversion-tab'
import { EconomyTab } from './_components/economy-tab'
import { BehaviorTab } from './_components/behavior-tab'

type Period = '7d' | '30d' | '90d' | '12m'
type Tab = 'overview' | 'health' | 'conversion' | 'economy' | 'behavior'

const validPeriods: Period[] = ['7d', '30d', '90d', '12m']
const validTabs: Tab[] = ['overview', 'health', 'conversion', 'economy', 'behavior']

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>
}) {
  const user = await requireAdmin()
  if (!user.organizationId) {
    return <p>Din brugerkonto er ikke tilknyttet en organisation.</p>
  }

  const params = await searchParams
  const period: Period = validPeriods.includes(params.period as Period)
    ? (params.period as Period)
    : '30d'
  const tab: Tab = validTabs.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : 'overview'

  const orgId = user.organizationId

  // Only fetch data for the active tab
  let tabContent: React.ReactNode = null

  switch (tab) {
    case 'overview': {
      const data = await getOverviewStats(orgId, period)
      tabContent = <OverviewTab data={data} />
      break
    }
    case 'health': {
      const data = await getHealthStats(orgId, period)
      tabContent = <HealthTab data={data} />
      break
    }
    case 'conversion': {
      const data = await getConversionStats(orgId, period)
      tabContent = <ConversionTab data={data} />
      break
    }
    case 'economy': {
      const data = await getEconomyStats(orgId, period)
      tabContent = <EconomyTab data={data} />
      break
    }
    case 'behavior': {
      const data = await getBehaviorStats(orgId, period)
      tabContent = <BehaviorTab data={data} />
      break
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indsigt</h1>
          <p className="text-muted-foreground">
            Overblik over platformens sundhed, konvertering og økonomi
          </p>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <Suspense>
        <AnalyticsTabs>
          <div className="mt-6">
            {tabContent}
          </div>
        </AnalyticsTabs>
      </Suspense>
    </div>
  )
}
