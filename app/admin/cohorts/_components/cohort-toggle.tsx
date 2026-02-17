'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateCohortAction } from '../actions'

type CohortToggleProps = {
  cohortId: string
  isOpen: boolean
}

export function CohortToggle({ cohortId, isOpen }: CohortToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(isOpen)

  function handleToggle() {
    startTransition(async () => {
      try {
        await updateCohortAction(cohortId, { isOpen: !open })
        setOpen(!open)
        toast.success(open ? 'Kohorte lukket' : 'Kohorte åbnet')
      } catch {
        toast.error('Kunne ikke opdatere kohorte')
      }
    })
  }

  return (
    <Button
      variant={open ? "destructive" : "default"}
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? 'Opdaterer...' : open ? 'Luk kohorte' : 'Åbn kohorte'}
    </Button>
  )
}
