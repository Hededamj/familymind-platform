'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { value: 'overview', label: 'Overblik' },
  { value: 'health', label: 'Sundhed' },
  { value: 'conversion', label: 'Konvertering' },
  { value: 'economy', label: 'Økonomi' },
  { value: 'behavior', label: 'Adfærd' },
] as const

export function AnalyticsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('tab') ?? 'overview'

  function handleChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`)
  }

  return (
    <Tabs value={current} onValueChange={handleChange}>
      <TabsList className="w-full justify-start">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}
