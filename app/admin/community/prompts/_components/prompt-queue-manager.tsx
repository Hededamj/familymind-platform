'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  Upload,
  ChevronDown,
  Check,
  X,
} from 'lucide-react'
import {
  createPromptAction,
  bulkImportPromptsAction,
  updatePromptAction,
  deletePromptAction,
} from '../actions'

type Prompt = {
  id: string
  roomId: string
  promptText: string
  priority: number
  postedAt: Date | null
  isPaused: boolean
  createdAt: Date
  room: { name: string; slug: string }
}

type Room = {
  id: string
  name: string
  icon: string | null
  prompts: Prompt[]
}

type Props = {
  rooms: Room[]
}

export function PromptQueueManager({ rooms }: Props) {
  const [isPending, startTransition] = useTransition()

  // Create prompt state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createRoomId, setCreateRoomId] = useState<string>('')
  const [createText, setCreateText] = useState('')

  // Bulk import state
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkRoomId, setBulkRoomId] = useState<string>('')
  const [bulkText, setBulkText] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editPriority, setEditPriority] = useState(0)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')

  function handleCreate() {
    if (!createRoomId || !createText.trim()) return
    startTransition(async () => {
      const result = await createPromptAction(createRoomId, createText)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Prompt oprettet')
        setShowCreateDialog(false)
        setCreateText('')
        setCreateRoomId('')
      }
    })
  }

  function handleBulkImport() {
    if (!bulkRoomId || !bulkText.trim()) return
    startTransition(async () => {
      const result = await bulkImportPromptsAction(bulkRoomId, bulkText)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${result.count} prompts importeret`)
        setShowBulkDialog(false)
        setBulkText('')
        setBulkRoomId('')
      }
    })
  }

  function startEdit(prompt: Prompt) {
    setEditingId(prompt.id)
    setEditText(prompt.promptText)
    setEditPriority(prompt.priority)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
    setEditPriority(0)
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      const result = await updatePromptAction(id, {
        promptText: editText,
        priority: editPriority,
      })
      if (result.success) {
        toast.success('Prompt opdateret')
        setEditingId(null)
      }
    })
  }

  function handleTogglePause(id: string, currentlyPaused: boolean) {
    startTransition(async () => {
      const result = await updatePromptAction(id, {
        isPaused: !currentlyPaused,
      })
      if (result.success) {
        toast.success(currentlyPaused ? 'Prompt genoptaget' : 'Prompt sat på pause')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePromptAction(id)
      if (result.success) {
        toast.success('Prompt slettet')
        setDeleteId(null)
      }
    })
  }

  function getStatusBadge(prompt: Prompt) {
    if (prompt.postedAt) {
      return <Badge variant="secondary">Postet</Badge>
    }
    if (prompt.isPaused) {
      return <Badge variant="outline">Pauset</Badge>
    }
    return <Badge variant="default">Ventende</Badge>
  }

  const totalPrompts = rooms.reduce((sum, r) => sum + r.prompts.length, 0)

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 size-4" />
          Tilføj prompt
        </Button>
        <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
          <Upload className="mr-2 size-4" />
          Bulk import
        </Button>
      </div>

      {/* Rooms with prompts */}
      {rooms.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen rum oprettet endnu. Opret et rum først.
          </p>
        </div>
      ) : totalPrompts === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen prompts oprettet endnu. Tilføj den første prompt ovenfor.
          </p>
        </div>
      ) : (
        rooms
          .filter((room) => room.prompts.length > 0)
          .map((room) => (
            <Collapsible key={room.id} defaultOpen>
              <div className="rounded-md border">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {room.icon && (
                      <span className="text-muted-foreground">{room.icon}</span>
                    )}
                    <h2 className="text-lg font-semibold">{room.name}</h2>
                    <Badge variant="secondary">{room.prompts.length}</Badge>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[45%]">Prompt-tekst</TableHead>
                        <TableHead>Prioritet</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Postet</TableHead>
                        <TableHead className="w-[120px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {room.prompts.map((prompt) => (
                        <TableRow key={prompt.id}>
                          <TableCell>
                            {editingId === prompt.id ? (
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                className="min-w-[200px]"
                              />
                            ) : (
                              <span
                                className="line-clamp-2"
                                title={prompt.promptText}
                              >
                                {prompt.promptText}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === prompt.id ? (
                              <Input
                                type="number"
                                value={editPriority}
                                onChange={(e) =>
                                  setEditPriority(Number(e.target.value))
                                }
                                className="w-20"
                              />
                            ) : (
                              prompt.priority
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(prompt)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {prompt.postedAt
                              ? new Date(prompt.postedAt).toLocaleDateString(
                                  'da-DK',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {editingId === prompt.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0"
                                    disabled={isPending}
                                    onClick={() => handleSaveEdit(prompt.id)}
                                    title="Gem"
                                  >
                                    <Check className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0"
                                    disabled={isPending}
                                    onClick={cancelEdit}
                                    title="Annuller"
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0"
                                    disabled={isPending}
                                    onClick={() => startEdit(prompt)}
                                    title="Rediger"
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  {!prompt.postedAt && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="size-8 p-0"
                                      disabled={isPending}
                                      onClick={() =>
                                        handleTogglePause(
                                          prompt.id,
                                          prompt.isPaused
                                        )
                                      }
                                      title={
                                        prompt.isPaused
                                          ? 'Genoptag'
                                          : 'Sæt på pause'
                                      }
                                    >
                                      {prompt.isPaused ? (
                                        <Play className="size-4" />
                                      ) : (
                                        <Pause className="size-4" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0 text-destructive hover:text-destructive"
                                    disabled={isPending}
                                    onClick={() => {
                                      setDeleteId(prompt.id)
                                      setDeleteName(
                                        prompt.promptText.length > 60
                                          ? prompt.promptText.slice(0, 60) +
                                              '...'
                                          : prompt.promptText
                                      )
                                    }}
                                    title="Slet"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
      )}

      {/* Create prompt dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj prompt</DialogTitle>
            <DialogDescription>
              Opret en ny diskussionsprompt til et community-rum.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rum</Label>
              <Select value={createRoomId} onValueChange={setCreateRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg et rum" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.icon ? `${room.icon} ` : ''}
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prompt-tekst</Label>
              <Textarea
                value={createText}
                onChange={(e) => setCreateText(e.target.value)}
                placeholder="Skriv din prompt her..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !createRoomId || !createText.trim()}
            >
              {isPending ? 'Opretter...' : 'Opret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk import prompts</DialogTitle>
            <DialogDescription>
              Importer flere prompts på en gang. Skriv en prompt per linje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rum</Label>
              <Select value={bulkRoomId} onValueChange={setBulkRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg et rum" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.icon ? `${room.icon} ` : ''}
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prompts (en per linje)</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  'Hvad er jeres bedste tip til sengetid?\nHvordan håndterer I konflikter?\nDel en god oplevelse fra denne uge.'
                }
                rows={8}
              />
              {bulkText.trim() && (
                <p className="text-sm text-muted-foreground">
                  {
                    bulkText
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean).length
                  }{' '}
                  prompts fundet
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={isPending || !bulkRoomId || !bulkText.trim()}
            >
              {isPending ? 'Importerer...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slet prompt</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil slette denne prompt?
              <br />
              <span className="font-medium">&quot;{deleteName}&quot;</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
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
