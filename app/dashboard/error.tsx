'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="mb-2 font-serif text-lg">Noget gik galt</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Vi kunne ikke indlæse dit dashboard. Prøv igen om et øjeblik.
        </p>
        <Button onClick={reset} className="rounded-xl">
          Prøv igen
        </Button>
      </div>
    </div>
  )
}
