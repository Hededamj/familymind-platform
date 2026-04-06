'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { deleteProductAction } from '../actions'

type ProductActionsProps = {
  productId: string
  title: string
}

export function ProductActions({ productId, title }: ProductActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const canDelete = confirmText === title

  function handleDelete() {
    if (!canDelete) return
    startTransition(async () => {
      try {
        await deleteProductAction(productId)
        toast.success('Produkt slettet')
        setShowDeleteDialog(false)
      } catch {
        toast.error('Kunne ikke slette produkt')
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
            onClick={() => router.push(`/admin/products/${productId}/edit`)}
          >
            <Pencil className="mr-2 size-4" />
            Rediger
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

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open)
        if (!open) setConfirmText('')
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet produkt permanent</AlertDialogTitle>
            <AlertDialogDescription>
              Alle lektioner, moduler og adgangsrettigheder tilknyttet
              dette produkt bliver slettet. Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Skriv <span className="font-semibold text-foreground">{title}</span> for at bekræfte:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={title}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowDeleteDialog(false); setConfirmText('') }}
              disabled={isPending}
            >
              Annullér
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || isPending}
            >
              {isPending ? 'Sletter...' : 'Slet permanent'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
