'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
        <button
          key={pt.value}
          onClick={() => handleFilter(pt.value)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            currentType === pt.value
              ? 'bg-primary text-white'
              : 'border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          {pt.label}
        </button>
      ))}
    </div>
  )
}
