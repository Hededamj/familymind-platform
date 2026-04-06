'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BookOpen, Compass, LayoutDashboard, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { markWelcomeSeen } from '@/app/dashboard/actions'

interface WelcomeDialogProps {
  brandName: string
  hasActiveJourney: boolean
}

const actions = [
  {
    href: '/browse',
    icon: BookOpen,
    label: 'Udforsk kurser',
    description: 'Find kurser der passer til dig',
  },
  {
    href: '/community',
    icon: Users,
    label: 'Besøg fællesskabet',
    description: 'Mød andre i samme situation',
  },
]

const journeyAction = {
  href: '/browse',
  icon: Compass,
  label: 'Start en rejse',
  description: 'Daglige øvelser og refleksioner',
}

export function WelcomeDialog({ brandName, hasActiveJourney }: WelcomeDialogProps) {
  const [open, setOpen] = useState(true)
  const [isPending, startTransition] = useTransition()

  function handleDismiss() {
    setOpen(false)
    startTransition(async () => {
      await markWelcomeSeen()
    })
  }

  const allActions = hasActiveJourney
    ? actions
    : [...actions, journeyAction]

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) handleDismiss() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Velkommen til {brandName}!
          </DialogTitle>
          <DialogDescription>
            Her er et par ting du kan komme i gang med:
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {allActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              onClick={handleDismiss}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <action.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}

          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Se dit dashboard</p>
              <p className="text-xs text-muted-foreground">Luk og udforsk selv</p>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button onClick={handleDismiss} disabled={isPending} className="w-full sm:w-auto">
            Kom i gang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
