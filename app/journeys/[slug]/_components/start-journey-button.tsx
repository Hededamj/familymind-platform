'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { startJourneyAction } from '../actions'

export function StartJourneyButton({
  journeyId,
  journeySlug,
}: {
  journeyId: string
  journeySlug: string
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await startJourneyAction(journeyId)
      if ('error' in result && result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result.currentDayId) {
        router.push(`/journeys/${journeySlug}/day/${result.currentDayId}`)
      }
    } catch {
      setError('Noget gik galt. Prøv igen.')
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        size="lg"
        className="w-full"
        onClick={handleStart}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Starter...
          </>
        ) : (
          <>
            Start forløb
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
