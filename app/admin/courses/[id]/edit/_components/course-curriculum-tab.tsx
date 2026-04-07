'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  addModuleAction,
  updateModuleAction,
  deleteModuleAction,
  addLessonAction,
  removeLessonAction,
  setLessonFreePreviewAction,
  listAvailableContentUnitsAction,
} from '../../../actions'

type Lesson = {
  id: string
  moduleId: string | null
  position: number
  isFreePreview: boolean
  contentUnit: { id: string; title: string; mediaType: string }
}

type Module = {
  id: string
  title: string
  description: string | null
  position: number
}

type ContentUnitOption = {
  id: string
  title: string
  mediaType: string
  durationMinutes: number | null
}

export function CourseCurriculumTab({
  courseId,
  modules,
  lessons,
}: {
  courseId: string
  modules: Module[]
  lessons: Lesson[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Add module
  const [showAddModule, setShowAddModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newModuleDesc, setNewModuleDesc] = useState('')

  // Edit module
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState('')
  const [editModuleDesc, setEditModuleDesc] = useState('')

  // Delete module
  const [deletingModule, setDeletingModule] = useState<Module | null>(null)

  // Add lesson
  const [addLessonForModule, setAddLessonForModule] = useState<string | null | undefined>(undefined)
  const [availableUnits, setAvailableUnits] = useState<ContentUnitOption[]>([])

  const lessonsByModule = new Map<string | null, Lesson[]>()
  for (const lesson of lessons) {
    const arr = lessonsByModule.get(lesson.moduleId) ?? []
    arr.push(lesson)
    lessonsByModule.set(lesson.moduleId, arr)
  }
  for (const arr of lessonsByModule.values()) arr.sort((a, b) => a.position - b.position)

  const unassigned = lessonsByModule.get(null) ?? []

  function refresh() {
    router.refresh()
  }

  function handleAddModule() {
    if (!newModuleTitle.trim()) return
    startTransition(async () => {
      try {
        await addModuleAction(courseId, {
          title: newModuleTitle,
          description: newModuleDesc || undefined,
        })
        toast.success('Modul tilføjet')
        setNewModuleTitle('')
        setNewModuleDesc('')
        setShowAddModule(false)
        refresh()
      } catch {
        toast.error('Kunne ikke tilføje modul')
      }
    })
  }

  function openEditModule(mod: Module) {
    setEditingModule(mod)
    setEditModuleTitle(mod.title)
    setEditModuleDesc(mod.description ?? '')
  }

  function handleUpdateModule() {
    if (!editingModule) return
    startTransition(async () => {
      try {
        await updateModuleAction(editingModule.id, {
          title: editModuleTitle,
          description: editModuleDesc || null,
        })
        toast.success('Modul opdateret')
        setEditingModule(null)
        refresh()
      } catch {
        toast.error('Kunne ikke opdatere modul')
      }
    })
  }

  function handleDeleteModule() {
    if (!deletingModule) return
    startTransition(async () => {
      try {
        await deleteModuleAction(deletingModule.id)
        toast.success('Modul slettet')
        setDeletingModule(null)
        refresh()
      } catch {
        toast.error('Kunne ikke slette modul')
      }
    })
  }

  async function openAddLesson(moduleId: string | null) {
    setAddLessonForModule(moduleId)
    try {
      const usedIds = lessons.map((l) => l.contentUnit.id)
      const units = await listAvailableContentUnitsAction(usedIds)
      setAvailableUnits(units)
    } catch {
      toast.error('Kunne ikke hente lektioner')
    }
  }

  function handlePickLesson(contentUnitId: string) {
    const moduleId = addLessonForModule
    startTransition(async () => {
      try {
        await addLessonAction(courseId, contentUnitId, moduleId ?? undefined)
        toast.success('Lektion tilføjet')
        setAddLessonForModule(undefined)
        refresh()
      } catch {
        toast.error('Kunne ikke tilføje lektion')
      }
    })
  }

  function handleRemoveLesson(lessonId: string) {
    startTransition(async () => {
      try {
        await removeLessonAction(lessonId)
        toast.success('Lektion fjernet')
        refresh()
      } catch {
        toast.error('Kunne ikke fjerne lektion')
      }
    })
  }

  function handleToggleFreePreview(lessonId: string, value: boolean) {
    startTransition(async () => {
      try {
        await setLessonFreePreviewAction(lessonId, value)
        refresh()
      } catch {
        toast.error('Kunne ikke opdatere')
      }
    })
  }

  function renderLessonRow(lesson: Lesson) {
    return (
      <div
        key={lesson.id}
        className="flex items-center gap-3 rounded-md border bg-card p-3"
      >
        <span className="w-6 text-center text-sm text-muted-foreground">
          {lesson.position + 1}
        </span>
        <div className="flex-1">
          <div className="text-sm font-medium">{lesson.contentUnit.title}</div>
        </div>
        <Badge variant="outline">{lesson.contentUnit.mediaType}</Badge>
        <div className="flex items-center gap-2">
          <Switch
            checked={lesson.isFreePreview}
            onCheckedChange={(v) => handleToggleFreePreview(lesson.id, v)}
            disabled={isPending}
          />
          <span className="text-xs text-muted-foreground">Gratis preview</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => handleRemoveLesson(lesson.id)}
          disabled={isPending}
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddModule(true)}>
          <Plus className="mr-2 size-4" />
          Tilføj modul
        </Button>
      </div>

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uden modul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassigned.map(renderLessonRow)}
          </CardContent>
        </Card>
      )}

      {modules.length === 0 && unassigned.length === 0 && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Ingen moduler endnu. Tilføj dit første modul for at komme i gang.
        </div>
      )}

      {modules
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((mod) => {
          const moduleLessons = lessonsByModule.get(mod.id) ?? []
          return (
            <Card key={mod.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                  {mod.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => openEditModule(mod)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-destructive"
                    onClick={() => setDeletingModule(mod)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {moduleLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen lektioner i dette modul endnu.</p>
                ) : (
                  moduleLessons.map(renderLessonRow)
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => openAddLesson(mod.id)}
                >
                  <Plus className="mr-2 size-4" />
                  Tilføj lektion til {mod.title}
                </Button>
              </CardContent>
            </Card>
          )
        })}

      {/* Add Module Dialog */}
      <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj modul</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newModuleTitle">Titel *</Label>
              <Input
                id="newModuleTitle"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newModuleDesc">Beskrivelse</Label>
              <Textarea
                id="newModuleDesc"
                value={newModuleDesc}
                onChange={(e) => setNewModuleDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModule(false)} disabled={isPending}>
              Annuller
            </Button>
            <Button onClick={handleAddModule} disabled={isPending || !newModuleTitle.trim()}>
              {isPending ? 'Tilføjer...' : 'Tilføj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(o) => !o && setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger modul</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editModuleTitle">Titel *</Label>
              <Input
                id="editModuleTitle"
                value={editModuleTitle}
                onChange={(e) => setEditModuleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleDesc">Beskrivelse</Label>
              <Textarea
                id="editModuleDesc"
                value={editModuleDesc}
                onChange={(e) => setEditModuleDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)} disabled={isPending}>
              Annuller
            </Button>
            <Button onClick={handleUpdateModule} disabled={isPending}>
              {isPending ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module AlertDialog */}
      <AlertDialog open={!!deletingModule} onOpenChange={(o) => !o && setDeletingModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet modul</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette modulet &quot;{deletingModule?.title}&quot;?
              Lektioner i modulet bliver flyttet til &quot;Uden modul&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteModule()
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Sletter...' : 'Slet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Lesson Dialog */}
      <Dialog
        open={addLessonForModule !== undefined}
        onOpenChange={(o) => !o && setAddLessonForModule(undefined)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tilføj lektion</DialogTitle>
            <DialogDescription>
              Vælg en lektion at tilføje til kurset. Lektioner der allerede er i kurset, vises
              ikke.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {availableUnits.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Ingen tilgængelige lektioner.
              </p>
            ) : (
              availableUnits.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handlePickLesson(u.id)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium">{u.title}</div>
                    {u.durationMinutes != null && (
                      <div className="text-xs text-muted-foreground">{u.durationMinutes} min</div>
                    )}
                  </div>
                  <Badge variant="outline">{u.mediaType}</Badge>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
