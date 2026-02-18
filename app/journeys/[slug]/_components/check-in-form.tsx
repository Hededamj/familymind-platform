'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowRight, PartyPopper } from 'lucide-react'
import { completeDayAction } from '../actions'

interface CheckInOption {
  id: string
  label: string
  value: string
  emoji: string | null
}

interface CheckInFormProps {
  userJourneyId: string
  dayId: string
  journeySlug: string
  checkInOptions: CheckInOption[]
  isCurrentDay: boolean
}

export function CheckInForm({
  userJourneyId,
  dayId,
  journeySlug,
  checkInOptions,
  isCurrentDay,
}: CheckInFormProps) {
  const router = useRouter()
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  if (!isCurrentDay) {
    return null
  }

  // Show celebration screen when journey is completed
  if (showCelebration) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-green-100">
          <PartyPopper className="size-10 text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Forløb gennemført!</h2>
        <p className="mb-6 text-muted-foreground">
          Fantastisk indsats! Du har gennemført hele forløbet.
        </p>
        <Button onClick={() => router.push('/dashboard')} size="lg">
          Gå til dashboard
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    )
  }

  async function handleSubmit() {
    if (!selectedOptionId) {
      setError('Vælg venligst hvordan det gik.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await completeDayAction(
        userJourneyId,
        dayId,
        selectedOptionId,
        reflection || undefined,
        journeySlug
      )

      if (result.completed) {
        // Show inline celebration before redirecting
        setShowCelebration(true)
      } else if (result.nextDayId) {
        router.push(`/journeys/${journeySlug}/day/${result.nextDayId}`)
      }
    } catch {
      setError('Noget gik galt. Prøv igen.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Check-in question */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Hvordan gik det?</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {checkInOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSelectedOptionId(option.id)
                setError(null)
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all active:scale-95 ${
                selectedOptionId === option.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <span className="text-2xl" role="img" aria-label={option.label}>
                {option.emoji}
              </span>
              <span className="text-xs font-medium leading-tight">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reflection textarea */}
      <div>
        <label
          htmlFor="reflection"
          className="mb-2 block text-sm font-medium text-muted-foreground"
        >
          Skriv en refleksion (valgfrit)
        </label>
        <Textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Hvad tænker du over i dag?"
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {/* Submit button - fixed at bottom on mobile */}
      <div className="sticky bottom-4 pt-2">
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedOptionId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Gemmer...
            </>
          ) : (
            <>
              Færdiggør denne dag
              <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
