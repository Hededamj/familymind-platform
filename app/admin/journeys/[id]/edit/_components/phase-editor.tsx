'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Check,
  X,
  Pencil,
} from 'lucide-react'
import {
  updatePhaseAction,
  deletePhaseAction,
  createDayAction,
} from '../../../actions'
import { DayEditor } from './day-editor'

type ContentUnit = {
  id: string
  title: string
  slug: string
  mediaType: string
}

type DayContent = {
  id: string
  contentUnitId: string
  position: number
  contentUnit: ContentUnit
}

type DayAction = {
  id: string
  actionText: string
  reflectionPrompt: string | null
}

type DiscussionPromptType = {
  id: string
  promptText: string
  isActive: boolean
}

type Day = {
  id: string
  position: number
  title: string | null
  contents: DayContent[]
  actions: DayAction[]
  discussionPrompts: DiscussionPromptType[]
}

type Phase = {
  id: string
  title: string
  position: number
  days: Day[]
}

type PhaseEditorProps = {
  phase: Phase
  allContentUnits: ContentUnit[]
  defaultOpen?: boolean
}

export function PhaseEditor({
  phase,
  allContentUnits,
  defaultOpen = false,
}: PhaseEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(phase.title)

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleSaveTitle() {
    startTransition(async () => {
      try {
        await updatePhaseAction(phase.id, { title: titleValue })
        setIsEditingTitle(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke opdatere fase')
      }
    })
  }

  function handleDeletePhase() {
    startTransition(async () => {
      try {
        await deletePhaseAction(phase.id)
        toast.success('Fase slettet')
        setShowDeleteDialog(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke slette fase')
      }
    })
  }

  function handleAddDay() {
    startTransition(async () => {
      try {
        await createDayAction(phase.id)
        toast.success('Dag tilfojet')
        setIsOpen(true)
        router.refresh()
      } catch {
        toast.error('Kunne ikke oprette dag')
      }
    })
  }

  return (
    <div className="rounded-lg border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Phase header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                {isOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <Badge variant="outline">Fase {phase.position}</Badge>

            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="h-8 w-64"
                  disabled={isPending}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0"
                  onClick={handleSaveTitle}
                  disabled={isPending}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0"
                  onClick={() => {
                    setIsEditingTitle(false)
                    setTitleValue(phase.title)
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1 text-sm font-semibold hover:text-primary"
              >
                {phase.title}
                <Pencil className="size-3 text-muted-foreground" />
              </button>
            )}

            <span className="text-xs text-muted-foreground">
              {phase.days.length} {phase.days.length === 1 ? 'dag' : 'dage'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleAddDay}
              disabled={isPending}
            >
              <Plus className="mr-1 size-3" />
              Tilfoej dag
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="size-8 p-0 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Phase content (days) */}
        <CollapsibleContent>
          <div className="border-t px-4 py-4 space-y-3">
            {phase.days.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Ingen dage i denne fase endnu.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={handleAddDay}
                  disabled={isPending}
                >
                  <Plus className="mr-1 size-4" />
                  Tilfoej foerste dag
                </Button>
              </div>
            ) : (
              phase.days.map((day) => (
                <DayEditor
                  key={day.id}
                  day={day}
                  allContentUnits={allContentUnits}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete phase confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet fase</DialogTitle>
            <DialogDescription>
              Er du sikker paa, at du vil slette fasen &quot;{phase.title}
              &quot;? Alle dage, indhold og handlinger i denne fase vil
              ogsaa blive slettet.
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
              onClick={handleDeletePhase}
              disabled={isPending}
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
