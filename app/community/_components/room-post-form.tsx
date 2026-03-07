'use client'

import { useTransition, useState } from 'react'
import { createRoomPostAction } from '@/app/community/actions'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type RoomPostFormProps = {
  roomId: string
  roomSlug: string
}

const MAX_LENGTH = 5000

export function RoomPostForm({ roomId, roomSlug }: RoomPostFormProps) {
  const [body, setBody] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!body.trim() || isPending) return
    setError(null)

    startTransition(async () => {
      const result = await createRoomPostAction(roomId, body, roomSlug, isPublic)
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
        placeholder="Hvad tænker du på?"
        maxLength={MAX_LENGTH}
        rows={4}
        className="resize-none text-[16px] sm:text-sm"
        disabled={isPending}
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="post-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={isPending}
          />
          <Label
            htmlFor="post-public"
            className="cursor-pointer text-xs text-muted-foreground"
          >
            Vis offentligt
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {body.length}/{MAX_LENGTH}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="min-h-[44px] active:scale-[0.98]"
          >
            {isPending ? 'Opretter...' : 'Del opslag'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
