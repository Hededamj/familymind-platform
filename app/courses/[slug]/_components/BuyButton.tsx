'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function BuyButton({
  priceVariantId,
  label = 'Køb',
}: {
  priceVariantId: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceVariantId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Der opstod en fejl')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Ingen checkout-URL modtaget')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        size="lg"
        className="w-full rounded-xl"
      >
        {loading ? 'Et øjeblik…' : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
