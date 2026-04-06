'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteAccountAction } from '../actions'

const CONFIRM_TEXT = 'SLET'

export function DeleteAccountSection() {
  const [confirmInput, setConfirmInput] = useState('')
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isConfirmed = confirmInput === CONFIRM_TEXT

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteAccountAction()
        // Redirect sker i server action — dette nås kun ved fejl
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Noget gik galt'
        toast.error(message)
        setOpen(false)
        setConfirmInput('')
      }
    })
  }

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <Trash2 className="size-4 text-destructive" />
        <h2 className="font-serif text-lg text-destructive">Slet konto</h2>
      </div>
      <div className="rounded-2xl border border-destructive/20 bg-white p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Når du sletter din konto, fjernes alle dine data permanent. Dette kan
          ikke fortrydes.
        </p>

        <AlertDialog open={open} onOpenChange={(v) => {
          setOpen(v)
          if (!v) setConfirmInput('')
        }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="rounded-xl">
              <Trash2 className="mr-2 size-4" />
              Slet min konto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slet din konto permanent</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">
                  Alle dine data bliver slettet permanent, inklusiv dine
                  fremskridt, check-ins og indstillinger. Aktive abonnementer
                  annulleres. Denne handling kan ikke fortrydes.
                </span>
                <span className="block font-medium text-foreground">
                  Skriv <span className="font-bold">{CONFIRM_TEXT}</span> for at
                  bekr&aelig;fte:
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_TEXT}
              className="rounded-xl"
              autoComplete="off"
              disabled={isPending}
            />

            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl" disabled={isPending}>
                Annuller
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!isConfirmed || isPending}
                className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
              >
                {isPending ? 'Sletter...' : 'Slet min konto permanent'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
