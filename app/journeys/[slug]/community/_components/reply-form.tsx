'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createReplyAction } from '../actions'

type ReplyFormProps = {
  postId: string
  journeySlug: string
  onSubmitted?: () => void
}

export function ReplyForm({ postId, journeySlug, onSubmitted }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!body.trim()) return

    startTransition(async () => {
      const result = await createReplyAction(postId, body, journeySlug)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setBody('')
      onSubmitted?.()
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Skriv et svar..."
        rows={2}
        className="resize-none text-sm"
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
        >
          {isPending ? 'Sender...' : 'Svar'}
        </Button>
      </div>
    </div>
  )
}
