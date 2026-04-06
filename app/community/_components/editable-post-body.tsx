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
  deleteCommunityReplyAction,
  updateCommunityReplyAction,
} from '@/app/community/actions'

// --- Editable Post Body (for detail page) ---

type EditablePostProps = {
  postId: string
  postSlug: string
  roomSlug: string
  isOwner: boolean
  isAdmin: boolean
  body: string
  children: React.ReactNode
}

export function EditablePost({
  postId,
  postSlug,
  roomSlug,
  isOwner,
  isAdmin,
  body,
  children,
}: EditablePostProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(body)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRoomPostAction(postId, roomSlug)
      if (!result.error) {
        setShowDeleteDialog(false)
        router.push(`/community/${roomSlug}`)
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
    <div>
      {/* Action menu row */}
      {!isEditing && (
        <div className="mb-2 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
        </div>
      )}

      {/* Body or edit form */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
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
      ) : (
        children
      )}

      {/* Delete dialog */}
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

// --- Editable Reply Body ---

type EditableReplyProps = {
  replyId: string
  roomSlug: string
  postSlug: string
  isOwner: boolean
  isAdmin: boolean
  body: string
  children: React.ReactNode
}

export function EditableReply({
  replyId,
  roomSlug,
  postSlug,
  isOwner,
  isAdmin,
  body,
  children,
}: EditableReplyProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(body)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCommunityReplyAction(replyId, roomSlug, postSlug)
      if (!result.error) {
        setShowDeleteDialog(false)
      }
    })
  }

  function handleSave() {
    if (!editText.trim() || isPending) return
    setError(null)
    startTransition(async () => {
      const result = await updateCommunityReplyAction(replyId, editText, roomSlug, postSlug)
      if (result.error) {
        setError(result.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  return (
    <div>
      {!isEditing && (
        <div className="mb-2 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={2000}
            rows={3}
            className="resize-none text-[16px] sm:text-sm"
            disabled={isPending}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {editText.length}/2000
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
      ) : (
        children
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet svar</AlertDialogTitle>
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
