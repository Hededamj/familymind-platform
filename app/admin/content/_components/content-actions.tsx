'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Globe, GlobeLock, Trash2 } from 'lucide-react'
import {
  deleteContentAction,
  publishContentAction,
  unpublishContentAction,
} from '../actions'

type ContentActionsProps = {
  contentId: string
  title: string
  isPublished: boolean
}

export function ContentActions({
  contentId,
  title,
  isPublished,
}: ContentActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false)

  function handlePublishToggle() {
    if (isPublished) {
      setShowUnpublishDialog(true)
      return
    }
    startTransition(async () => {
      try {
        await publishContentAction(contentId)
        toast.success('Indhold publiceret')
      } catch {
        toast.error('Handling fejlede')
      }
    })
  }

  function handleUnpublish() {
    startTransition(async () => {
      try {
        await unpublishContentAction(contentId)
        toast.success('Indhold afpubliceret')
        setShowUnpublishDialog(false)
      } catch {
        toast.error('Handling fejlede')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteContentAction(contentId)
        toast.success('Indhold slettet')
        setShowDeleteDialog(false)
      } catch {
        toast.error('Kunne ikke slette indhold')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8 p-0">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Handlinger</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/admin/content/${contentId}/edit`)}
          >
            <Pencil className="mr-2 size-4" />
            Rediger
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePublishToggle} disabled={isPending}>
            {isPublished ? (
              <>
                <GlobeLock className="mr-2 size-4" />
                Afpublicer
              </>
            ) : (
              <>
                <Globe className="mr-2 size-4" />
                Publicer
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Slet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet indhold</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil slette &ldquo;{title}&rdquo;? Denne
              handling kan ikke fortrydes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afpublicer indhold</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil afpublicere &quot;{title}&quot;? Indholdet vil
              ikke længere være synligt for brugere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? 'Afpublicerer...' : 'Afpublicer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
