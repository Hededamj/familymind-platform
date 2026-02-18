'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { createPostAction } from '../actions'

type NewPostFormProps = {
  cohortId: string
  journeySlug: string
}

export function NewPostForm({ cohortId, journeySlug }: NewPostFormProps) {
  const [body, setBody] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!body.trim()) return

    startTransition(async () => {
      const result = await createPostAction(cohortId, body, journeySlug)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setBody('')
      setIsOpen(false)
      toast.success('Indlæg oprettet')
    })
  }

  if (!isOpen) {
    return (
      <Card
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            Del noget med din gruppe...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Hvad tænker du på? Del en oplevelse, stil et spørgsmål..."
          rows={4}
          className="resize-none text-sm"
          maxLength={5000}
          autoFocus
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {body.length}/5000
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false)
                setBody('')
              }}
            >
              Annuller
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || !body.trim()}
            >
              {isPending ? 'Opretter...' : 'Del indlæg'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
