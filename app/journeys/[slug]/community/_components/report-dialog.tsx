'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { reportContentAction } from '../actions'

type ReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  journeySlug: string
  postId?: string
  replyId?: string
}

export function ReportDialog({
  open,
  onOpenChange,
  journeySlug,
  postId,
  replyId,
}: ReportDialogProps) {
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!reason.trim()) return

    startTransition(async () => {
      const result = await reportContentAction(
        reason,
        journeySlug,
        postId,
        replyId
      )
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Tak for din rapport. Vi kigger på det.')
      setReason('')
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rapportér indhold</DialogTitle>
          <DialogDescription>
            Beskriv venligst hvorfor du rapporterer dette indhold.
            Vores moderatorer vil gennemgå det.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="F.eks. upassende sprog, spam, chikane..."
          rows={3}
          className="resize-none"
          maxLength={500}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason('')
              onOpenChange(false)
            }}
          >
            Annuller
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || !reason.trim()}
          >
            {isPending ? 'Sender...' : 'Send rapport'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
