'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Tag = { id: string; name: string; color: string }
type Journey = { id: string; title: string }

export function UserFilters({
  tags,
  journeys,
}: {
  tags: Tag[]
  journeys: Journey[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(
    searchParams.get('search') ?? ''
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 when filters change
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      const currentSearch = searchParams.get('search') ?? ''
      if (searchValue !== currentSearch) {
        updateParam('search', searchValue)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchValue, searchParams, updateParam])

  const clearFilters = () => {
    setSearchValue('')
    router.push(pathname)
  }

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('role') ||
    searchParams.get('status') ||
    searchParams.get('tagId') ||
    searchParams.get('journeyId')

  return (
    <div className="space-y-3">
      <Input
        placeholder="Søg på navn eller email..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
          value={searchParams.get('role') ?? ''}
          onChange={(e) => updateParam('role', e.target.value)}
        >
          <option value="">Rolle</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
          value={searchParams.get('status') ?? ''}
          onChange={(e) => updateParam('status', e.target.value)}
        >
          <option value="">Status</option>
          <option value="TRIAL">Prøve</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Inaktiv</option>
          <option value="CHURNED">Frafaldne</option>
        </select>

        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
          value={searchParams.get('tagId') ?? ''}
          onChange={(e) => updateParam('tagId', e.target.value)}
        >
          <option value="">Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
          value={searchParams.get('journeyId') ?? ''}
          onChange={(e) => updateParam('journeyId', e.target.value)}
        >
          <option value="">Forløb</option>
          {journeys.map((journey) => (
            <option key={journey.id} value={journey.id}>
              {journey.title}
            </option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Ryd filtre
          </Button>
        )}
      </div>
    </div>
  )
}
