'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManage() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
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
    <div>
      <Button onClick={handleManage} disabled={loading} variant="outline">
        {loading ? '\u00c5bner...' : 'Administrer abonnement'}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
