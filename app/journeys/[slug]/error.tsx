'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="mb-2 font-serif text-lg">Kunne ikke indlæse forløbet</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Prøv igen eller gå tilbage til dit dashboard.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="outline" className="rounded-xl">
            Prøv igen
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/dashboard">Til dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
