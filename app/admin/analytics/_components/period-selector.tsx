'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const periods = [
  { value: '7d', label: '7 dage' },
  { value: '30d', label: '30 dage' },
  { value: '90d', label: '90 dage' },
  { value: '12m', label: '12 mdr' },
] as const

export function PeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') ?? '30d'

  function handleChange(period: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={current === p.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
