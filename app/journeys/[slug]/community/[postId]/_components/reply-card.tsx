'use client'

import { useState, useTransition } from 'react'
import { Heart, Trash2, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleReactionAction, deleteReplyAction } from '../../actions'
import { ReportDialog } from '../../_components/report-dialog'
import { formatDistanceToNow } from '@/lib/utils/date'

type ReplyCardProps = {
  reply: {
    id: string
    body: string
    createdAt: string | Date
    author: { id: string; name: string | null }
    reactions?: { id: string; emoji: string }[] | { user: { id: string; name: string | null } }[]
  }
  postId: string
  currentUserId: string
  isAdmin: boolean
  journeySlug: string
}

export function ReplyCard({
  reply,
  postId,
  currentUserId,
  isAdmin,
  journeySlug,
}: ReplyCardProps) {
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasLiked = Array.isArray(reply.reactions)
    ? reply.reactions.some((r) => {
        if ('emoji' in r) return r.emoji === '❤️'
        if ('user' in r) return r.user.id === currentUserId
        return false
      })
    : false

  function handleReaction() {
    startTransition(async () => {
      await toggleReactionAction('❤️', journeySlug, undefined, reply.id)
    })
  }

  function handleDelete() {
    if (!confirm('Er du sikker på, at du vil slette dette svar?')) return
    startTransition(async () => {
      await deleteReplyAction(reply.id, postId, journeySlug)
    })
  }

  const canDelete = reply.author.id === currentUserId || isAdmin
  const canReport = reply.author.id !== currentUserId

  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
          {(reply.author.name ?? 'A').charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-medium">{reply.author.name ?? 'Anonym'}</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(reply.createdAt))}
        </span>
      </div>
      <p className="mb-2 whitespace-pre-wrap text-sm">{reply.body}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 gap-1 px-1.5 text-[10px] ${
            hasLiked ? 'text-red-500' : 'text-muted-foreground'
          }`}
          onClick={handleReaction}
          disabled={isPending}
        >
          <Heart className={`size-3 ${hasLiked ? 'fill-current' : ''}`} />
        </Button>

        {canReport && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-orange-500"
            onClick={() => setShowReportDialog(true)}
            disabled={isPending}
          >
            <Flag className="size-3" />
          </Button>
        )}

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        journeySlug={journeySlug}
        replyId={reply.id}
      />
    </div>
  )
}
