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
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Archive } from 'lucide-react'
import { archiveRoomAction } from '../actions'

type RoomActionsProps = {
  roomId: string
  name: string
  isArchived: boolean
}

export function RoomActions({ roomId, name, isArchived }: RoomActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveRoomAction(roomId)
        toast.success('Rum arkiveret')
        setShowArchiveDialog(false)
      } catch {
        toast.error('Kunne ikke arkivere rum')
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
            onClick={() =>
              router.push(`/admin/community/rooms/${roomId}/edit`)
            }
          >
            <Pencil className="mr-2 size-4" />
            Rediger
          </DropdownMenuItem>
          {!isArchived && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowArchiveDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 size-4" />
                Arkiver
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arkiver rum</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil arkivere &quot;{name}&quot;? Rummet
              vil ikke længere være synligt for brugere.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isPending}
            >
              {isPending ? 'Arkiverer...' : 'Arkiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
