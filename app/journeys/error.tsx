'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function JourneysError({
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">Noget gik galt</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Der opstod en uventet fejl. Prøv igen, eller kontakt support hvis problemet fortsætter.
      </p>
      <Button onClick={() => reset()}>
        Prøv igen
      </Button>
    </div>
  )
}
