'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { markCompletedAction } from '../actions'
import { toast } from 'sonner'

interface MarkCompleteButtonProps {
  contentUnitId: string
  isCompleted: boolean
}

export function MarkCompleteButton({
  contentUnitId,
  isCompleted: initialCompleted,
}: MarkCompleteButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (completed) return

    startTransition(async () => {
      try {
        await markCompletedAction(contentUnitId)
        setCompleted(true)
        toast.success('Indhold markeret som f\u00e6rdigt!')
      } catch {
        toast.error('Noget gik galt. Pr\u00f8v igen.')
      }
    })
  }

  if (completed) {
    return (
      <Button variant="outline" disabled className="w-full sm:w-auto">
        <Check className="mr-2 size-4" />
        F\u00e6rdig
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="w-full sm:w-auto"
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Check className="mr-2 size-4" />
      )}
      Mark\u00e9r som f\u00e6rdig
    </Button>
  )
}
