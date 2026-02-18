'use client'

import { useState, useTransition } from 'react'
import { Heart, MessageCircle, Trash2, Pin, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toggleReactionAction, deletePostAction, reportContentAction } from '../actions'
import { ReplyForm } from './reply-form'
import { ReportDialog } from './report-dialog'
import { formatDistanceToNow } from '@/lib/utils/date'

type PostCardProps = {
  post: {
    id: string
    body: string
    isPrompt: boolean
    isPinned: boolean
    createdAt: string | Date
    author: { id: string; name: string | null }
    day?: { id: string; title: string | null; position: number } | null
    _count: { replies: number; reactions: number }
    reactions?: { id: string; emoji: string }[]
  }
  currentUserId: string
  isAdmin: boolean
  journeySlug: string
  cohortId: string
  showFullThread?: boolean
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  journeySlug,
  cohortId,
  showFullThread = false,
}: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasLiked = post.reactions?.some((r) => r.emoji === '❤️') ?? false

  function handleReaction() {
    startTransition(async () => {
      await toggleReactionAction('❤️', journeySlug, post.id)
    })
  }

  function handleDelete() {
    if (!confirm('Er du sikker på, at du vil slette dette indlæg?')) return
    startTransition(async () => {
      await deletePostAction(post.id, journeySlug)
    })
  }

  const canDelete = post.author.id === currentUserId || isAdmin
  const canReport = post.author.id !== currentUserId && !post.isPrompt

  return (
    <Card className={post.isPrompt ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="pt-5">
        {/* Post header */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {(post.author.name ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">
                {post.isPrompt ? 'Diskussionsspørgsmål' : post.author.name ?? 'Anonym'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {post.isPinned && (
              <Pin className="size-3.5 text-primary" />
            )}
            {post.day && (
              <Badge variant="secondary" className="text-xs">
                Dag {post.day.position}
              </Badge>
            )}
          </div>
        </div>

        {/* Post body */}
        <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
          {post.body}
        </p>

        {/* Action bar */}
        <div className="flex items-center gap-3 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 px-2 text-xs ${
              hasLiked ? 'text-red-500' : 'text-muted-foreground'
            }`}
            onClick={handleReaction}
            disabled={isPending}
          >
            <Heart className={`size-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            {post._count.reactions > 0 && post._count.reactions}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <MessageCircle className="size-3.5" />
            {post._count.replies > 0 && post._count.replies}
            {!showFullThread && post._count.replies === 0 && 'Svar'}
          </Button>

          <div className="ml-auto flex items-center gap-1">
            {canReport && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-orange-500"
                onClick={() => setShowReportDialog(true)}
                disabled={isPending}
              >
                <Flag className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <ReplyForm
              postId={post.id}
              journeySlug={journeySlug}
              onSubmitted={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Report dialog */}
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          journeySlug={journeySlug}
          postId={post.id}
        />
      </CardContent>
    </Card>
  )
}
