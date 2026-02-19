'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function JourneyError({
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
          <h2 className="mb-2 text-lg font-semibold">Kunne ikke indlæse forløbet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Prøv igen eller gå tilbage til dit dashboard.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={reset} variant="outline">Prøv igen</Button>
            <Button asChild>
              <Link href="/dashboard">Til dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
