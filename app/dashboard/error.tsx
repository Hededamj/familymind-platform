'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <h2 className="mb-2 text-lg font-semibold">Noget gik galt</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Vi kunne ikke indlæse dit dashboard. Prøv igen om et øjeblik.
          </p>
          <Button onClick={reset}>Prøv igen</Button>
        </CardContent>
      </Card>
    </div>
  )
}
