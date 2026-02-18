'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function BuyButton({
  productId,
  productType,
}: {
  productId: string
  productType: string
}) {
  const [discountCode, setDiscountCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
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

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Der opstod en fejl. Prøv igen.')
      setLoading(false)
    }
  }

  const buttonLabel =
    productType === 'SUBSCRIPTION' ? 'Start abonnement' : 'Køb nu'
  const loadingLabel = 'Sender til betaling...'

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
        onClick={handleBuy}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? loadingLabel : buttonLabel}
      </Button>
    </div>
  )
}
