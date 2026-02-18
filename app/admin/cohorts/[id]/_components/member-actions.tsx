'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'
import { banUserAction } from '../../actions'

type MemberActionsProps = {
  cohortId: string
  userId: string
  userName: string
}

export function MemberActions({ cohortId, userId, userName }: MemberActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleBan() {
    const reason = prompt(`Årsag for udelukkelse af ${userName} (valgfrit):`)
    if (reason === null) return // Cancelled

    startTransition(async () => {
      try {
        await banUserAction(cohortId, userId, reason || undefined)
        toast.success(`${userName} er blevet udelukket`)
      } catch {
        toast.error('Kunne ikke udelukke bruger')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
      onClick={handleBan}
      disabled={isPending}
    >
      <Ban className="size-3.5" />
      Udeluk
    </Button>
  )
}
