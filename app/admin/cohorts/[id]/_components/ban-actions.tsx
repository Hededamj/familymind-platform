'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { unbanUserAction } from '../../actions'

type BanActionsProps = {
  cohortId: string
  userId: string
}

export function BanActions({ cohortId, userId }: BanActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleUnban() {
    startTransition(async () => {
      try {
        await unbanUserAction(cohortId, userId)
        toast.success('Udelukkelse ophævet')
      } catch {
        toast.error('Kunne ikke ophæve udelukkelse')
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs"
      onClick={handleUnban}
      disabled={isPending}
    >
      {isPending ? 'Ophæver...' : 'Ophæv'}
    </Button>
  )
}
