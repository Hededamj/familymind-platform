'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  ChevronRight,
  Save,
  X,
} from 'lucide-react'
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
  moveQuestionAction,
  createOptionAction,
  updateOptionAction,
  deleteOptionAction,
} from '../actions'

type Tag = { id: string; name: string; slug: string }

type Option = {
  id: string
  questionId: string
  label: string
  value: string
  tagId: string | null
  position: number
  tag: Tag | null
}

type Question = {
  id: string
  questionText: string
  questionType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'DATE' | 'SLIDER'
  position: number
  isActive: boolean
  helperText: string | null
  options: Option[]
}

const QUESTION_TYPES = [
  { value: 'SINGLE_SELECT', label: 'Enkelt valg' },
  { value: 'MULTI_SELECT', label: 'Flere valg' },
  { value: 'DATE', label: 'Dato' },
  { value: 'SLIDER', label: 'Slider' },
] as const

type OnboardingManagerProps = {
  questions: Question[]
  tags: Tag[]
}

export function OnboardingManager({
  questions,
  tags,
}: OnboardingManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [showNewQuestion, setShowNewQuestion] = useState(false)

  // New question form state
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<Question['questionType']>('SINGLE_SELECT')
  const [newHelper, setNewHelper] = useState('')

  // Edit question form state
  const [editText, setEditText] = useState('')
  const [editType, setEditType] = useState<Question['questionType']>('SINGLE_SELECT')
  const [editHelper, setEditHelper] = useState('')
  const [editActive, setEditActive] = useState(true)

  function handleCreateQuestion() {
    if (!newText.trim()) return
    startTransition(async () => {
      try {
        await createQuestionAction({
          questionText: newText.trim(),
          questionType: newType,
          helperText: newHelper.trim() || undefined,
        })
        toast.success('Spørgsmål oprettet')
        setNewText('')
        setNewType('SINGLE_SELECT')
        setNewHelper('')
        setShowNewQuestion(false)
      } catch {
        toast.error('Kunne ikke oprette spørgsmål')
      }
    })
  }

  function startEditQuestion(q: Question) {
    setEditingQuestion(q)
    setEditText(q.questionText)
    setEditType(q.questionType)
    setEditHelper(q.helperText ?? '')
    setEditActive(q.isActive)
  }

  function handleUpdateQuestion() {
    if (!editingQuestion || !editText.trim()) return
    startTransition(async () => {
      try {
        await updateQuestionAction(editingQuestion.id, {
          questionText: editText.trim(),
          questionType: editType,
          helperText: editHelper.trim() || undefined,
          isActive: editActive,
        })
        toast.success('Spørgsmål opdateret')
        setEditingQuestion(null)
      } catch {
        toast.error('Kunne ikke opdatere spørgsmål')
      }
    })
  }

  function handleDeleteQuestion() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteQuestionAction(deleteTarget.id)
        toast.success('Spørgsmål slettet')
        setDeleteTarget(null)
        if (expandedId === deleteTarget.id) setExpandedId(null)
      } catch {
        toast.error('Kunne ikke slette spørgsmål')
      }
    })
  }

  function handleMove(id: string, direction: 'up' | 'down') {
    startTransition(async () => {
      try {
        await moveQuestionAction(id, direction)
      } catch {
        toast.error('Kunne ikke flytte spørgsmål')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* New question form */}
      {showNewQuestion ? (
        <div className="rounded-md border p-4 space-y-4 bg-muted/30">
          <h3 className="font-semibold">Nyt spørgsmål</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Spørgsmålstekst</Label>
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Hvad beskriver bedst din situation?"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newType}
                onValueChange={(v) =>
                  setNewType(v as Question['questionType'])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hjælpetekst (valgfrit)</Label>
            <Input
              value={newHelper}
              onChange={(e) => setNewHelper(e.target.value)}
              placeholder="Valgfri beskrivelse under spørgsmålet"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateQuestion} disabled={isPending || !newText.trim()}>
              <Save className="mr-2 size-4" />
              {isPending ? 'Opretter...' : 'Gem spørgsmål'}
            </Button>
            <Button variant="outline" onClick={() => setShowNewQuestion(false)}>
              Annuller
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowNewQuestion(true)}>
          <Plus className="mr-2 size-4" />
          Tilføj spørgsmål
        </Button>
      )}

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen spørgsmål endnu. Tilføj dit første spørgsmål ovenfor.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-md border">
              {/* Question row */}
              <div className="flex items-center gap-2 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() =>
                    setExpandedId(expandedId === q.id ? null : q.id)
                  }
                >
                  <ChevronRight
                    className={`size-4 transition-transform ${
                      expandedId === q.id ? 'rotate-90' : ''
                    }`}
                  />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {q.position + 1}. {q.questionText}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {QUESTION_TYPES.find((t) => t.value === q.questionType)
                        ?.label ?? q.questionType}
                    </Badge>
                    {!q.isActive && (
                      <Badge variant="outline" className="shrink-0 text-muted-foreground">
                        Inaktiv
                      </Badge>
                    )}
                  </div>
                  {q.helperText && (
                    <p className="text-sm text-muted-foreground truncate">
                      {q.helperText}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => handleMove(q.id, 'up')}
                    disabled={isPending || idx === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => handleMove(q.id, 'down')}
                    disabled={isPending || idx === questions.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => startEditQuestion(q)}
                    disabled={isPending}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(q)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded options */}
              {expandedId === q.id && (
                <div className="border-t bg-muted/20 p-4">
                  <OptionsEditor
                    questionId={q.id}
                    options={q.options}
                    tags={tags}
                    isPending={isPending}
                    startTransition={startTransition}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit question dialog */}
      <Dialog
        open={!!editingQuestion}
        onOpenChange={(open) => !open && setEditingQuestion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger spørgsmål</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Spørgsmålstekst</Label>
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={editType}
                onValueChange={(v) =>
                  setEditType(v as Question['questionType'])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hjælpetekst (valgfrit)</Label>
              <Input
                value={editHelper}
                onChange={(e) => setEditHelper(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="size-4"
              />
              <Label htmlFor="edit-active">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingQuestion(null)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button onClick={handleUpdateQuestion} disabled={isPending}>
              {isPending ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet spørgsmål</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil slette spørgsmålet &ldquo;
              {deleteTarget?.questionText}&rdquo;? Alle tilhørende
              svarmuligheder slettes også. Denne handling kan ikke fortrydes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteQuestion}
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

// ─── Options Editor (sub-component) ─────────────────

type OptionsEditorProps = {
  questionId: string
  options: Option[]
  tags: Tag[]
  isPending: boolean
  startTransition: React.TransitionStartFunction
}

function OptionsEditor({
  questionId,
  options,
  tags,
  isPending,
  startTransition,
}: OptionsEditorProps) {
  const [showNew, setShowNew] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newTagId, setNewTagId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editTagId, setEditTagId] = useState('')
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<string | null>(null)

  function handleCreate() {
    if (!newLabel.trim() || !newValue.trim()) return
    startTransition(async () => {
      try {
        await createOptionAction(questionId, {
          label: newLabel.trim(),
          value: newValue.trim(),
          tagId: newTagId || undefined,
        })
        toast.success('Svarmulighed oprettet')
        setNewLabel('')
        setNewValue('')
        setNewTagId('')
        setShowNew(false)
      } catch {
        toast.error('Kunne ikke oprette svarmulighed')
      }
    })
  }

  function startEdit(opt: Option) {
    setEditingId(opt.id)
    setEditLabel(opt.label)
    setEditValue(opt.value)
    setEditTagId(opt.tagId ?? '')
  }

  function handleUpdate() {
    if (!editingId || !editLabel.trim() || !editValue.trim()) return
    startTransition(async () => {
      try {
        await updateOptionAction(editingId, {
          label: editLabel.trim(),
          value: editValue.trim(),
          tagId: editTagId || undefined,
        })
        toast.success('Svarmulighed opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere svarmulighed')
      }
    })
  }

  function handleDeleteConfirmed() {
    if (!deleteOptionTarget) return
    startTransition(async () => {
      try {
        await deleteOptionAction(deleteOptionTarget)
        toast.success('Svarmulighed slettet')
        setDeleteOptionTarget(null)
      } catch {
        toast.error('Kunne ikke slette svarmulighed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Svarmuligheder</h4>
        {!showNew && (
          <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
            <Plus className="mr-1 size-3" />
            Tilføj
          </Button>
        )}
      </div>

      {options.length === 0 && !showNew && (
        <p className="text-sm text-muted-foreground">
          Ingen svarmuligheder endnu.
        </p>
      )}

      {options.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Værdi</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((opt) =>
              editingId === opt.id ? (
                <TableRow key={opt.id}>
                  <TableCell>{opt.position + 1}</TableCell>
                  <TableCell>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editTagId}
                      onValueChange={setEditTagId}
                    >
                      <SelectTrigger className="h-8 w-full" size="sm">
                        <SelectValue placeholder="Ingen tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ingen tag</SelectItem>
                        {tags.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={handleUpdate}
                        disabled={isPending}
                      >
                        <Save className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={opt.id}>
                  <TableCell className="text-muted-foreground">
                    {opt.position + 1}
                  </TableCell>
                  <TableCell>{opt.label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{opt.value}</Badge>
                  </TableCell>
                  <TableCell>
                    {opt.tag ? (
                      <Badge variant="outline">{opt.tag.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Ingen
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => startEdit(opt)}
                        disabled={isPending}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteOptionTarget(opt.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}

      {/* New option inline form */}
      {showNew && (
        <div className="rounded border p-3 space-y-3 bg-background">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="F.eks. Søvn"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Værdi</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="F.eks. sleep"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tag (valgfrit)</Label>
              <Select value={newTagId} onValueChange={setNewTagId}>
                <SelectTrigger className="h-8 w-full" size="sm">
                  <SelectValue placeholder="Vælg tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen tag</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isPending || !newLabel.trim() || !newValue.trim()}
            >
              {isPending ? 'Opretter...' : 'Gem'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
              Annuller
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteOptionTarget} onOpenChange={(open) => !open && setDeleteOptionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet svarmulighed</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette denne svarmulighed? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
