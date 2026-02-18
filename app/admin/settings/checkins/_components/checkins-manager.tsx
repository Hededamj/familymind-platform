'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react'
import {
  createCheckInOptionAction,
  updateCheckInOptionAction,
  deleteCheckInOptionAction,
  moveCheckInOptionAction,
} from '../actions'

type CheckInOption = {
  id: string
  label: string
  value: string
  emoji: string | null
  position: number
  isActive: boolean
}

type CheckInsManagerProps = {
  options: CheckInOption[]
}

export function CheckInsManager({ options }: CheckInsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CheckInOption | null>(null)

  // New form state
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newEmoji, setNewEmoji] = useState('')

  // Edit form state
  const [editLabel, setEditLabel] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editActive, setEditActive] = useState(true)

  function handleCreate() {
    if (!newLabel.trim() || !newValue.trim()) return
    startTransition(async () => {
      try {
        await createCheckInOptionAction({
          label: newLabel.trim(),
          value: newValue.trim(),
          emoji: newEmoji.trim() || undefined,
        })
        toast.success('Check-in mulighed oprettet')
        setNewLabel('')
        setNewValue('')
        setNewEmoji('')
        setShowNew(false)
      } catch {
        toast.error('Kunne ikke oprette check-in mulighed')
      }
    })
  }

  function startEdit(opt: CheckInOption) {
    setEditingId(opt.id)
    setEditLabel(opt.label)
    setEditValue(opt.value)
    setEditEmoji(opt.emoji ?? '')
    setEditActive(opt.isActive)
  }

  function handleUpdate() {
    if (!editingId || !editLabel.trim() || !editValue.trim()) return
    startTransition(async () => {
      try {
        await updateCheckInOptionAction(editingId, {
          label: editLabel.trim(),
          value: editValue.trim(),
          emoji: editEmoji.trim() || undefined,
          isActive: editActive,
        })
        toast.success('Check-in mulighed opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere check-in mulighed')
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteCheckInOptionAction(deleteTarget.id)
        toast.success('Check-in mulighed slettet')
        setDeleteTarget(null)
      } catch {
        toast.error('Kunne ikke slette check-in mulighed')
      }
    })
  }

  function handleMove(id: string, direction: 'up' | 'down') {
    startTransition(async () => {
      try {
        await moveCheckInOptionAction(id, direction)
      } catch {
        toast.error('Kunne ikke flytte check-in mulighed')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* New option form */}
      {showNew ? (
        <div className="rounded-md border p-4 space-y-4 bg-muted/30">
          <h3 className="font-semibold">Ny check-in mulighed</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="F.eks. Godt"
              />
            </div>
            <div className="space-y-2">
              <Label>Værdi</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="F.eks. good"
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji (valgfrit)</Label>
              <Input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="F.eks. 😊"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={isPending || !newLabel.trim() || !newValue.trim()}
            >
              <Save className="mr-2 size-4" />
              {isPending ? 'Opretter...' : 'Gem'}
            </Button>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Annuller
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 size-4" />
          Tilføj mulighed
        </Button>
      )}

      {/* Options list */}
      {options.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen check-in muligheder endnu. Tilføj din første mulighed
            ovenfor.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos.</TableHead>
                <TableHead className="w-16">Emoji</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Værdi</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-[160px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((opt, idx) =>
                editingId === opt.id ? (
                  <TableRow key={opt.id}>
                    <TableCell className="text-muted-foreground">
                      {opt.position + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editEmoji}
                        onChange={(e) => setEditEmoji(e.target.value)}
                        className="h-8 w-14"
                      />
                    </TableCell>
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
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="size-4"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          onClick={handleUpdate}
                          disabled={isPending}
                        >
                          <Save className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={opt.id}>
                    <TableCell className="text-muted-foreground">
                      {opt.position + 1}
                    </TableCell>
                    <TableCell className="text-lg">
                      {opt.emoji || '-'}
                    </TableCell>
                    <TableCell className="font-medium">{opt.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{opt.value}</Badge>
                    </TableCell>
                    <TableCell>
                      {opt.isActive ? (
                        <Badge>Aktiv</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Inaktiv
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          onClick={() => handleMove(opt.id, 'up')}
                          disabled={isPending || idx === 0}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          onClick={() => handleMove(opt.id, 'down')}
                          disabled={isPending || idx === options.length - 1}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          onClick={() => startEdit(opt)}
                          disabled={isPending}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(opt)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet check-in mulighed</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil slette "{deleteTarget?.label}
              "? Denne handling kan ikke fortrydes.
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
              onClick={handleDelete}
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
