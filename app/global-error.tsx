'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="da">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Noget gik galt</h2>
          <p>Vi har registreret fejlen og arbejder på at løse den.</p>
          <button onClick={reset}>Prøv igen</button>
        </div>
      </body>
    </html>
  )
}
