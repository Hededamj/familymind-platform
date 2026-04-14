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
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Save } from 'lucide-react'
import {
  createRuleAction,
  updateRuleAction,
  deleteRuleAction,
} from '../actions'

type Tag = { id: string; name: string; slug: string }
type Target = { id: string; title: string }

type Conditions = {
  tagId?: string
  ageMin?: number
  ageMax?: number
}

type Rule = {
  id: string
  name: string
  conditions: unknown
  targetType: string
  targetId: string
  priority: number
  isActive: boolean
}

type RoomTarget = { id: string; name: string }

type RecommendationsManagerProps = {
  rules: Rule[]
  tags: Tag[]
  journeys: Target[]
  courses: Target[]
  bundles: Target[]
  rooms: RoomTarget[]
}

function parseConditions(c: unknown): Conditions {
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    return c as Conditions
  }
  return {}
}

function conditionsSummary(c: unknown, tags: Tag[]): string {
  const cond = parseConditions(c)
  const parts: string[] = []

  if (cond.tagId) {
    const tag = tags.find((t) => t.id === cond.tagId)
    parts.push(`Tag: ${tag?.name ?? 'Ukendt'}`)
  }
  if (cond.ageMin !== undefined || cond.ageMax !== undefined) {
    const min = cond.ageMin ?? 0
    const max = cond.ageMax ?? '+'
    parts.push(`Alder: ${min}-${max} år`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Ingen betingelser'
}

function targetLabel(
  targetType: string,
  targetId: string,
  journeys: Target[],
  courses: Target[],
  bundles: Target[],
  rooms: RoomTarget[]
): string {
  if (targetType === 'JOURNEY') {
    const j = journeys.find((x) => x.id === targetId)
    return j ? `Forløb: ${j.title}` : 'Forløb: Ukendt'
  }
  if (targetType === 'ROOM') {
    const r = rooms.find((x) => x.id === targetId)
    return r ? `Rum: ${r.name}` : 'Rum: Ukendt'
  }
  if (targetType === 'COURSE') {
    const c = courses.find((x) => x.id === targetId)
    return c ? `Kursus: ${c.title}` : 'Kursus: Ukendt'
  }
  if (targetType === 'BUNDLE') {
    const b = bundles.find((x) => x.id === targetId)
    return b ? `Bundel: ${b.title}` : 'Bundel: Ukendt'
  }
  return `${targetType}: Ukendt`
}

export function RecommendationsManager({
  rules,
  tags,
  journeys,
  courses,
  bundles,
  rooms,
}: RecommendationsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [tagId, setTagId] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [targetType, setTargetType] = useState('JOURNEY')
  const [targetId, setTargetId] = useState('')
  const [priority, setPriority] = useState('0')
  const [isActive, setIsActive] = useState(true)

  function resetForm() {
    setName('')
    setTagId('')
    setAgeMin('')
    setAgeMax('')
    setTargetType('JOURNEY')
    setTargetId('')
    setPriority('0')
    setIsActive(true)
  }

  function openNew() {
    resetForm()
    setEditingRule(null)
    setShowForm(true)
  }

  function openEdit(rule: Rule) {
    const cond = parseConditions(rule.conditions)
    setName(rule.name)
    setTagId(cond.tagId ?? '')
    setAgeMin(cond.ageMin?.toString() ?? '')
    setAgeMax(cond.ageMax?.toString() ?? '')
    setTargetType(rule.targetType)
    setTargetId(rule.targetId)
    setPriority(rule.priority.toString())
    setIsActive(rule.isActive)
    setEditingRule(rule)
    setShowForm(true)
  }

  function buildConditions(): Conditions {
    const cond: Conditions = {}
    if (tagId && tagId !== 'none') cond.tagId = tagId
    if (ageMin) cond.ageMin = parseFloat(ageMin.replace(',', '.'))
    if (ageMax) cond.ageMax = parseFloat(ageMax.replace(',', '.'))
    return cond
  }

  function handleSave() {
    if (!name.trim() || !targetId) return

    startTransition(async () => {
      try {
        const data = {
          name: name.trim(),
          conditions: buildConditions(),
          targetType,
          targetId,
          priority: parseInt(priority, 10) || 0,
          isActive,
        }

        if (editingRule) {
          await updateRuleAction(editingRule.id, data)
          toast.success('Regel opdateret')
        } else {
          await createRuleAction(data)
          toast.success('Regel oprettet')
        }
        setShowForm(false)
        resetForm()
        setEditingRule(null)
      } catch {
        toast.error('Kunne ikke gemme regel')
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteRuleAction(deleteTarget.id)
        toast.success('Regel slettet')
        setDeleteTarget(null)
      } catch {
        toast.error('Kunne ikke slette regel')
      }
    })
  }

  const targets = targetType === 'JOURNEY'
    ? journeys
    : targetType === 'ROOM'
      ? rooms.map((r) => ({ id: r.id, title: r.name }))
      : targetType === 'COURSE'
        ? courses
        : targetType === 'BUNDLE'
          ? bundles
          : []

  return (
    <div className="space-y-4">
      {showForm ? (
        <div className="rounded-md border p-4 space-y-4 bg-muted/30">
          <h3 className="font-semibold">
            {editingRule ? 'Rediger regel' : 'Ny regel'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Navn</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Søvnforløb for 0-3 år"
              />
            </div>
            <div className="space-y-2">
              <Label>Prioritet</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Betingelser</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Tag</Label>
                <Select value={tagId} onValueChange={setTagId}>
                  <SelectTrigger className="w-full">
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
              <div className="space-y-1">
                <Label className="text-xs">Min. alder (år)</Label>
                <Input
                  type="number"
                  min="0"
                  max="18"
                  step="0.25"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max. alder (år)</Label>
                <Input
                  type="number"
                  min="0"
                  max="18"
                  step="0.25"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Mål</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={targetType}
                  onValueChange={(v) => {
                    setTargetType(v)
                    setTargetId('')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JOURNEY">Forløb</SelectItem>
                    <SelectItem value="COURSE">Kursus</SelectItem>
                    <SelectItem value="BUNDLE">Bundel</SelectItem>
                    <SelectItem value="ROOM">Rum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {targetType === 'JOURNEY' ? 'Forløb' : targetType === 'ROOM' ? 'Rum' : targetType === 'COURSE' ? 'Kursus' : 'Bundel'}
                </Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vælg..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {editingRule && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rule-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4"
              />
              <Label htmlFor="rule-active">Aktiv</Label>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isPending || !name.trim() || !targetId}
            >
              <Save className="mr-2 size-4" />
              {isPending ? 'Gemmer...' : 'Gem'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingRule(null)
                resetForm()
              }}
            >
              Annuller
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={openNew}>
          <Plus className="mr-2 size-4" />
          Tilføj regel
        </Button>
      )}

      {rules.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen anbefalingsregler endnu. Tilføj din første regel ovenfor.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Betingelser</TableHead>
                <TableHead>Mål</TableHead>
                <TableHead className="w-20">Prioritet</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="text-sm">
                    {conditionsSummary(rule.conditions, tags)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {targetLabel(
                      rule.targetType,
                      rule.targetId,
                      journeys,
                      courses,
                      bundles,
                      rooms
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rule.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    {rule.isActive ? (
                      <Badge>Aktiv</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
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
                        onClick={() => openEdit(rule)}
                        disabled={isPending}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(rule)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
            <DialogTitle>Slet regel</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil slette reglen "
              {deleteTarget?.name}"? Denne handling kan ikke fortrydes.
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
