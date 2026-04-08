'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { formatDKK } from '@/lib/format-currency'
import type { BillingInterval, BillingType } from '@prisma/client'

type Variant = {
  id: string
  label: string
  description: string | null
  amountCents: number
  currency: string
  billingType: BillingType
  interval: BillingInterval | null
  intervalCount: number
  isHighlighted: boolean
}

function billingDescription(v: Variant): string {
  const amount = formatDKK(v.amountCents)
  if (v.billingType === 'one_time') return `${amount} engangskøb`
  if (v.interval === 'month' && v.intervalCount === 1) return `${amount}/md`
  if (v.interval === 'month') return `${amount} hver ${v.intervalCount}. måned`
  if (v.interval === 'year' && v.intervalCount === 1) return `${amount}/år`
  if (v.interval === 'year') return `${amount} hver ${v.intervalCount}. år`
  return amount
}

export function BundlePricingCard({
  variants,
  isLoggedIn,
}: {
  variants: Variant[]
  isLoggedIn: boolean
}) {
  const initial = variants.find((v) => v.isHighlighted) ?? variants[0]
  const [selectedId, setSelectedId] = useState<string>(initial?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = variants.find((v) => v.id === selectedId) ?? initial

  async function handleCheckout() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceVariantId: selected.id }),
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

  if (variants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Der er ingen aktive prisvarianter på denne bundel endnu.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {variants.map((v) => {
        const isSelected = v.id === selectedId
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedId(v.id)}
            className={`relative w-full rounded-lg border p-4 text-left transition ${
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {v.isHighlighted && (
              <Badge className="absolute -top-2 right-3">
                <Star className="mr-1 size-3 fill-current" />
                Mest populær
              </Badge>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{v.label}</div>
                {v.description && (
                  <div className="text-sm text-muted-foreground">{v.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">{billingDescription(v)}</div>
              </div>
            </div>
          </button>
        )
      })}

      {isLoggedIn ? (
        <Button
          className="w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={loading || !selected}
        >
          {loading
            ? 'Et øjeblik...'
            : selected?.billingType === 'recurring'
              ? 'Start abonnement'
              : 'Køb'}
        </Button>
      ) : (
        <>
          <Button asChild className="w-full" size="lg">
            <a href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}>
              Log ind for at købe
            </a>
          </Button>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
