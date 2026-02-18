'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
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
    <div className="p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold">Fejl i admin</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || 'Noget gik galt. Prøv igen.'}
      </p>
      <Button onClick={reset}>Prøv igen</Button>
    </div>
  )
}
