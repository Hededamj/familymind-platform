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
      <div className="border-b">
        <TabsList className="w-full justify-start gap-0 rounded-none bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  )
}
