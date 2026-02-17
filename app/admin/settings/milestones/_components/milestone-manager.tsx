'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Pencil, Save, X } from 'lucide-react'
import { updateMilestoneDefinitionAction } from '../../engagement-actions'

type MilestoneDefinition = {
  id: string
  name: string
  triggerType: string
  triggerValue: number
  celebrationTitle: string
  celebrationMessage: string
  isActive: boolean
}

type MilestoneManagerProps = {
  milestones: MilestoneDefinition[]
}

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  DAYS_ACTIVE: 'Aktive dage',
  PHASE_COMPLETE: 'Fase gennemfoert',
  JOURNEY_COMPLETE: 'Rejse gennemfoert',
  CONTENT_COUNT: 'Antal indhold',
  CHECKIN_STREAK: 'Check-in-stribe',
}

const TRIGGER_TYPES = [
  'DAYS_ACTIVE',
  'PHASE_COMPLETE',
  'JOURNEY_COMPLETE',
  'CONTENT_COUNT',
  'CHECKIN_STREAK',
] as const

export function MilestoneManager({ milestones }: MilestoneManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editTriggerType, setEditTriggerType] = useState('')
  const [editTriggerValue, setEditTriggerValue] = useState(0)
  const [editCelebrationTitle, setEditCelebrationTitle] = useState('')
  const [editCelebrationMessage, setEditCelebrationMessage] = useState('')
  const [editActive, setEditActive] = useState(true)

  function startEdit(m: MilestoneDefinition) {
    setEditingId(m.id)
    setEditName(m.name)
    setEditTriggerType(m.triggerType)
    setEditTriggerValue(m.triggerValue)
    setEditCelebrationTitle(m.celebrationTitle)
    setEditCelebrationMessage(m.celebrationMessage)
    setEditActive(m.isActive)
  }

  function handleSave() {
    if (
      !editingId ||
      !editName.trim() ||
      !editTriggerType ||
      !editCelebrationTitle.trim() ||
      !editCelebrationMessage.trim()
    )
      return
    startTransition(async () => {
      try {
        await updateMilestoneDefinitionAction(editingId, {
          name: editName.trim(),
          triggerType: editTriggerType as (typeof TRIGGER_TYPES)[number],
          triggerValue: editTriggerValue,
          celebrationTitle: editCelebrationTitle.trim(),
          celebrationMessage: editCelebrationMessage.trim(),
          isActive: editActive,
        })
        toast.success('Milepael opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere milepael')
      }
    })
  }

  function handleToggle(m: MilestoneDefinition) {
    startTransition(async () => {
      try {
        await updateMilestoneDefinitionAction(m.id, {
          isActive: !m.isActive,
        })
        toast.success(
          m.isActive ? 'Milepael deaktiveret' : 'Milepael aktiveret'
        )
      } catch {
        toast.error('Kunne ikke opdatere status')
      }
    })
  }

  if (milestones.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          Ingen milepaalsdefinitioner konfigureret endnu. Koer seed-scriptet
          for at oprette standardmilep aele.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Milepaalsdefinitioner bruges til at fejre brugernes fremskridt.
        Hver milepael udloeses naar den angivne trigger-betingelse er opfyldt.
      </p>

      <div className="space-y-3">
        {milestones.map((m) => (
          <div key={m.id} className="rounded-md border">
            {editingId === m.id ? (
              // Edit mode
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Navn</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Trigger-type</Label>
                    <Select
                      value={editTriggerType}
                      onValueChange={setEditTriggerType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((tt) => (
                          <SelectItem key={tt} value={tt}>
                            {TRIGGER_TYPE_LABELS[tt]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger-vaerdi</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editTriggerValue}
                      onChange={(e) =>
                        setEditTriggerValue(Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fejringstitel</Label>
                  <Input
                    value={editCelebrationTitle}
                    onChange={(e) => setEditCelebrationTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fejringsbesked</Label>
                  <Textarea
                    value={editCelebrationMessage}
                    onChange={(e) => setEditCelebrationMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editActive}
                    onCheckedChange={setEditActive}
                  />
                  <Label>{editActive ? 'Aktiv' : 'Inaktiv'}</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={
                      isPending ||
                      !editName.trim() ||
                      !editCelebrationTitle.trim() ||
                      !editCelebrationMessage.trim()
                    }
                  >
                    <Save className="mr-2 size-4" />
                    {isPending ? 'Gemmer...' : 'Gem'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="mr-2 size-4" />
                    Annuller
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {TRIGGER_TYPE_LABELS[m.triggerType] ?? m.triggerType}
                    </Badge>
                    <Badge variant="outline">
                      Vaerdi: {m.triggerValue}
                    </Badge>
                    {m.isActive ? (
                      <Badge>Aktiv</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Inaktiv
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {m.celebrationTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.celebrationMessage}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={m.isActive}
                    onCheckedChange={() => handleToggle(m)}
                    disabled={isPending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(m)}
                    disabled={isPending}
                  >
                    <Pencil className="mr-1 size-4" />
                    Rediger
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
