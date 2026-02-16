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
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { deleteDiscountAction, toggleDiscountAction } from '../actions'

type DiscountActionsProps = {
  discountId: string
  code: string
  isActive: boolean
}

export function DiscountActions({
  discountId,
  code,
  isActive,
}: DiscountActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleDiscountAction(discountId, !isActive)
        toast.success(
          isActive ? 'Rabatkode deaktiveret' : 'Rabatkode aktiveret'
        )
      } catch {
        toast.error('Kunne ikke opdatere rabatkode')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteDiscountAction(discountId)
        toast.success('Rabatkode slettet')
        setShowDeleteDialog(false)
      } catch {
        toast.error('Kunne ikke slette rabatkode')
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
              router.push(`/admin/discounts/${discountId}/edit`)
            }
          >
            <Pencil className="mr-2 size-4" />
            Rediger
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
            {isActive ? (
              <>
                <ToggleLeft className="mr-2 size-4" />
                Deaktiver
              </>
            ) : (
              <>
                <ToggleRight className="mr-2 size-4" />
                Aktiver
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
            <DialogTitle>Slet rabatkode</DialogTitle>
            <DialogDescription>
              Er du sikker paa, at du vil slette rabatkoden &quot;{code}
              &quot;? Denne handling kan ikke fortrydes.
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
    </>
  )
}
