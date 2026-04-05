'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitDashboardReflection } from '../actions'

interface DashboardCheckInProps {
  prompt: string
  hasActiveDay: boolean
}

export function DashboardCheckIn({ prompt, hasActiveDay }: DashboardCheckInProps) {
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitDashboardReflection(reflection)

      if (result && 'error' in result) {
        setError(result.error ?? 'Noget gik galt. Prøv igen.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Noget gik galt. Prøv igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border-l-4 border-[var(--color-coral)] bg-[var(--color-sand-dark)] p-5 sm:p-6">
      <p className="font-serif text-lg leading-snug">{prompt}</p>

      {!hasActiveDay ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Start et forløb for at skrive daglige refleksioner.
        </p>
      ) : submitted ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-success)]">
          <Check className="size-4" />
          Din refleksion er gemt
        </div>
      ) : (
        <>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Skriv din refleksion her..."
            rows={3}
            maxLength={1000}
            className="mt-3 resize-none border-[var(--color-sand-dark)] bg-white/80 focus:bg-white"
          />

          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}

          <Button
            size="lg"
            className="mt-3 min-h-[44px] w-full rounded-xl"
            onClick={handleSubmit}
            disabled={isSubmitting || !reflection.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Gemmer...
              </>
            ) : (
              'Gem refleksion'
            )}
          </Button>
        </>
      )}
    </div>
  )
}
