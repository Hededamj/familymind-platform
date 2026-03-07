'use client'

import { useTransition, useState } from 'react'
import { createRoomReplyAction } from '@/app/community/actions'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type RoomReplyFormProps = {
  postId: string
  roomSlug: string
  postSlug: string
}

const MAX_LENGTH = 2000

export function RoomReplyForm({ postId, roomSlug, postSlug }: RoomReplyFormProps) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!body.trim() || isPending) return
    setError(null)

    startTransition(async () => {
      const result = await createRoomReplyAction(postId, body, roomSlug, postSlug)
      if (result.error) {
        setError(result.error)
      } else {
        setBody('')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Skriv et svar..."
        maxLength={MAX_LENGTH}
        rows={2}
        className="resize-none text-[16px] sm:text-sm"
        disabled={isPending}
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {body.length}/{MAX_LENGTH}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
          size="sm"
          className="min-h-[44px] active:scale-[0.98]"
        >
          {isPending ? 'Sender...' : 'Svar'}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
