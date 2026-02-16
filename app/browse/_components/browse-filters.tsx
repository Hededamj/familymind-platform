'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const productTypes = [
  { value: '', label: 'Alle' },
  { value: 'COURSE', label: 'Kurser' },
  { value: 'SINGLE', label: 'Enkeltstående' },
  { value: 'BUNDLE', label: 'Pakker' },
] as const

export function BrowseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type') ?? ''

  function handleFilter(type: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {productTypes.map((pt) => (
        <Button
          key={pt.value}
          variant={currentType === pt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilter(pt.value)}
        >
          {pt.label}
        </Button>
      ))}
    </div>
  )
}
