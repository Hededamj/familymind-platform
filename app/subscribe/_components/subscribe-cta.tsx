'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SubscribeCTA({ productId }: { productId: string }) {
  const [discountCode, setDiscountCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          discountCode: discountCode || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Der opstod en fejl. Pr\u00f8v igen.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Rabatkode (valgfrit)"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="max-w-[200px]"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Sender til betaling...' : 'Start abonnement'}
      </Button>
    </div>
  )
}
