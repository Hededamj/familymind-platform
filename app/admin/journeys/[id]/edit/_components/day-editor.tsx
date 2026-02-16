'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Trash2,
  Plus,
  X,
  FileText,
  Check,
  Pencil,
} from 'lucide-react'
import {
  updateDayAction,
  deleteDayAction,
  addContentToDayAction,
  removeContentFromDayAction,
  createDayActionItemAction,
  updateDayActionItemAction,
  deleteDayActionItemAction,
} from '../../../actions'

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

type Day = {
  id: string
  position: number
  title: string | null
  contents: DayContent[]
  actions: DayAction[]
}

type DayEditorProps = {
  day: Day
  allContentUnits: ContentUnit[]
}

export function DayEditor({ day, allContentUnits }: DayEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Day title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(day.title ?? '')

  // Content dialog
  const [showContentDialog, setShowContentDialog] = useState(false)
  const [contentSearch, setContentSearch] = useState('')

  // Action item creation
  const [showAddAction, setShowAddAction] = useState(false)
  const [newActionText, setNewActionText] = useState('')
  const [newReflectionPrompt, setNewReflectionPrompt] = useState('')

  // Action item editing
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [editActionText, setEditActionText] = useState('')
  const [editReflectionPrompt, setEditReflectionPrompt] = useState('')

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleSaveTitle() {
    startTransition(async () => {
      try {
        await updateDayAction(day.id, {
          title: titleValue || undefined,
        })
        setIsEditingTitle(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke opdatere dag')
      }
    })
  }

  function handleDeleteDay() {
    startTransition(async () => {
      try {
        await deleteDayAction(day.id)
        toast.success('Dag slettet')
        setShowDeleteDialog(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke slette dag')
      }
    })
  }

  function handleAddContent(contentUnitId: string) {
    startTransition(async () => {
      try {
        await addContentToDayAction(day.id, contentUnitId)
        toast.success('Indhold tilfojet')
        setShowContentDialog(false)
        setContentSearch('')
        router.refresh()
      } catch {
        toast.error('Kunne ikke tilfoeje indhold')
      }
    })
  }

  function handleRemoveContent(id: string) {
    startTransition(async () => {
      try {
        await removeContentFromDayAction(id)
        toast.success('Indhold fjernet')
        router.refresh()
      } catch {
        toast.error('Kunne ikke fjerne indhold')
      }
    })
  }

  function handleCreateAction() {
    if (!newActionText.trim()) return
    startTransition(async () => {
      try {
        await createDayActionItemAction(day.id, {
          actionText: newActionText.trim(),
          reflectionPrompt: newReflectionPrompt.trim() || undefined,
        })
        toast.success('Handling tilfojet')
        setNewActionText('')
        setNewReflectionPrompt('')
        setShowAddAction(false)
        router.refresh()
      } catch {
        toast.error('Kunne ikke oprette handling')
      }
    })
  }

  function handleStartEditAction(action: DayAction) {
    setEditingActionId(action.id)
    setEditActionText(action.actionText)
    setEditReflectionPrompt(action.reflectionPrompt ?? '')
  }

  function handleSaveAction(id: string) {
    startTransition(async () => {
      try {
        await updateDayActionItemAction(id, {
          actionText: editActionText.trim(),
          reflectionPrompt: editReflectionPrompt.trim() || undefined,
        })
        toast.success('Handling opdateret')
        setEditingActionId(null)
        router.refresh()
      } catch {
        toast.error('Kunne ikke opdatere handling')
      }
    })
  }

  function handleDeleteAction(id: string) {
    startTransition(async () => {
      try {
        await deleteDayActionItemAction(id)
        toast.success('Handling slettet')
        router.refresh()
      } catch {
        toast.error('Kunne ikke slette handling')
      }
    })
  }

  // Filter content units: exclude already-linked ones
  const linkedContentIds = new Set(day.contents.map((c) => c.contentUnitId))
  const availableContentUnits = allContentUnits.filter(
    (unit) =>
      !linkedContentIds.has(unit.id) &&
      (contentSearch === '' ||
        unit.title.toLowerCase().includes(contentSearch.toLowerCase()))
  )

  const mediaTypeLabels: Record<string, string> = {
    VIDEO: 'Video',
    AUDIO: 'Lyd',
    PDF: 'PDF',
    TEXT: 'Tekst',
  }

  return (
    <div className="rounded-md border bg-muted/20 p-4 space-y-4">
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Dag {day.position}
          </Badge>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                placeholder="Dagtitel (valgfrit)"
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
                  setTitleValue(day.title ?? '')
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              {day.title || 'Ingen titel'}
              <Pencil className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="size-8 p-0 text-destructive hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Content section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Indhold ({day.contents.length})
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setShowContentDialog(true)}
          >
            <Plus className="mr-1 size-3" />
            Tilfoej indhold
          </Button>
        </div>
        {day.contents.length > 0 && (
          <div className="space-y-1">
            {day.contents.map((content) => (
              <div
                key={content.id}
                className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>{content.contentUnit.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {mediaTypeLabels[content.contentUnit.mediaType] ??
                      content.contentUnit.mediaType}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveContent(content.id)}
                  disabled={isPending}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Handlinger ({day.actions.length})
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setShowAddAction(true)}
          >
            <Plus className="mr-1 size-3" />
            Tilfoej handling
          </Button>
        </div>

        {day.actions.map((action) => (
          <div
            key={action.id}
            className="rounded-md border bg-background px-3 py-2"
          >
            {editingActionId === action.id ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Handlingstekst</Label>
                  <Input
                    value={editActionText}
                    onChange={(e) => setEditActionText(e.target.value)}
                    className="h-8"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Refleksionsprompt (valgfrit)
                  </Label>
                  <Input
                    value={editReflectionPrompt}
                    onChange={(e) =>
                      setEditReflectionPrompt(e.target.value)
                    }
                    className="h-8"
                    placeholder="Hvordan gik det?"
                    disabled={isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSaveAction(action.id)}
                    disabled={isPending}
                  >
                    Gem
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setEditingActionId(null)}
                  >
                    Annuller
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm">{action.actionText}</p>
                  {action.reflectionPrompt && (
                    <p className="text-xs text-muted-foreground italic">
                      {action.reflectionPrompt}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0"
                    onClick={() => handleStartEditAction(action)}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteAction(action.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showAddAction && (
          <div className="rounded-md border bg-background p-3 space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Handlingstekst *</Label>
              <Input
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="F.eks. Proev dette med dit barn i dag"
                className="h-8"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Refleksionsprompt (valgfrit)</Label>
              <Input
                value={newReflectionPrompt}
                onChange={(e) => setNewReflectionPrompt(e.target.value)}
                placeholder="Hvordan gik det?"
                className="h-8"
                disabled={isPending}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleCreateAction}
                disabled={isPending || !newActionText.trim()}
              >
                Tilfoej
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setShowAddAction(false)
                  setNewActionText('')
                  setNewReflectionPrompt('')
                }}
              >
                Annuller
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content selection dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tilfoej indhold til dag {day.position}</DialogTitle>
            <DialogDescription>
              Vaelg indhold at tilfoeje til denne dag
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={contentSearch}
              onChange={(e) => setContentSearch(e.target.value)}
              placeholder="Soeg i indhold..."
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableContentUnits.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {allContentUnits.length === 0
                    ? 'Intet indhold tilgaengeligt. Opret indhold foerst.'
                    : 'Intet matchende indhold fundet.'}
                </p>
              ) : (
                availableContentUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => handleAddContent(unit.id)}
                    disabled={isPending}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <span>{unit.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {mediaTypeLabels[unit.mediaType] ?? unit.mediaType}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete day confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet dag</DialogTitle>
            <DialogDescription>
              Er du sikker paa, at du vil slette dag {day.position}
              {day.title ? ` (${day.title})` : ''}? Alt indhold og
              handlinger tilknyttet denne dag vil ogsaa blive fjernet.
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
              onClick={handleDeleteDay}
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
