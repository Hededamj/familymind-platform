'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

type Variant = {
  id: string
  label: string
  description: string | null
  amountCents: number
  currency: string
  billingType: 'one_time' | 'recurring'
  interval: 'month' | 'year' | null
  intervalCount: number
  trialDays: number | null
  isHighlighted: boolean
}

function formatPrice(v: Variant): string {
  const amount = (v.amountCents / 100).toLocaleString('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${amount} ${v.currency}`
}

function billingDescription(v: Variant): string {
  if (v.billingType === 'one_time') return 'Engangsbetaling — permanent adgang'
  if (v.interval === 'year') return 'Pr. år'
  if (v.interval === 'month') {
    if (v.intervalCount === 1) return 'Pr. måned'
    if (v.intervalCount === 3) return 'Hver 3. måned'
    if (v.intervalCount === 6) return 'Hver 6. måned'
    return `Hver ${v.intervalCount}. måned`
  }
  return ''
}

export function SubscribeCTA({
  productId,
  variants = [],
}: {
  productId: string
  variants?: Variant[]
}) {
  const defaultVariantId =
    variants.find((v) => v.isHighlighted)?.id ?? variants[0]?.id ?? null
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariantId
  )
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
          priceVariantId: selectedVariantId ?? undefined,
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
      setError('Der opstod en fejl. Prøv igen.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v) => {
            const selected = v.id === selectedVariantId
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div
                  className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {selected && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{v.label}</span>
                    {v.isHighlighted && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="size-3" /> Mest populær
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-serif text-lg">{formatPrice(v)}</span>
                    <span className="text-muted-foreground">
                      {' · '}
                      {billingDescription(v)}
                    </span>
                  </div>
                  {v.trialDays ? (
                    <p className="mt-1 text-xs text-success">
                      {v.trialDays} dages gratis prøve
                    </p>
                  ) : null}
                  {v.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

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
        disabled={loading || (variants.length > 0 && !selectedVariantId)}
        className="w-full"
        size="lg"
      >
        {loading ? 'Sender til betaling...' : 'Start'}
      </Button>
    </div>
  )
}
