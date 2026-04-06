'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function BrowseSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get('search') ?? ''
  const [value, setValue] = useState(currentSearch)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external URL changes (e.g. browser back/forward)
  useEffect(() => {
    setValue(currentSearch)
  }, [currentSearch])

  const updateUrl = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (term.trim()) {
        params.set('search', term.trim())
      } else {
        params.delete('search')
      }
      router.push(`/browse?${params.toString()}`)
    },
    [router, searchParams],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => updateUrl(next), 300)
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Søg efter kurser, forløb..."
        className="pl-9"
      />
    </div>
  )
}
