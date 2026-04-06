'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  deleteRoomPostAction,
  updateCommunityPostAction,
} from '@/app/community/actions'

type FeedPostActionsProps = {
  postId: string
  postSlug?: string
  roomSlug: string
  isOwner: boolean
  isAdmin: boolean
  body: string
}

export function FeedPostActions({
  postId,
  postSlug,
  roomSlug,
  isOwner,
  isAdmin,
  body,
}: FeedPostActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(body)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!isOwner && !isAdmin) return null

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRoomPostAction(postId, roomSlug)
      if (!result.error) {
        setShowDeleteDialog(false)
        router.refresh()
      }
    })
  }

  function handleSave() {
    if (!editText.trim() || isPending) return
    setError(null)
    startTransition(async () => {
      const result = await updateCommunityPostAction(postId, editText, roomSlug, postSlug)
      if (result.error) {
        setError(result.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  return (
    <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
      {!isEditing ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Handlinger"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                <Pencil className="size-4" />
                Rediger
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-4" />
              Slet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={5000}
            rows={4}
            className="resize-none text-[16px] sm:text-sm"
            disabled={isPending}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {editText.length}/5000
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditText(body)
                  setError(null)
                }}
                disabled={isPending}
                className="min-h-[36px]"
              >
                Annuller
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || !editText.trim()}
                className="min-h-[36px]"
              >
                {isPending ? 'Gemmer...' : 'Gem'}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet indl&aelig;g</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
