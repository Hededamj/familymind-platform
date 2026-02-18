'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { toast } from 'sonner'
import { Pencil, Save, X } from 'lucide-react'
import { updateNotificationScheduleAction } from '../../engagement-actions'

type NotificationSchedule = {
  id: string
  notificationType: string
  dayOfWeek: number
  timeOfDay: string
  isActive: boolean
}

type NotificationScheduleManagerProps = {
  schedules: NotificationSchedule[]
}

const DAY_LABELS: Record<number, string> = {
  0: 'Søndag',
  1: 'Mandag',
  2: 'Tirsdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lørdag',
}

const TYPE_LABELS: Record<string, string> = {
  WEEKLY_PLAN: 'Ugeplan',
  MIDWEEK_NUDGE: 'Midtugenudge',
  REFLECTION: 'Refleksion',
  MONTHLY_PROGRESS: 'Månedlig fremgang',
}

export function NotificationScheduleManager({
  schedules,
}: NotificationScheduleManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  // Edit form state
  const [editDayOfWeek, setEditDayOfWeek] = useState(0)
  const [editTimeOfDay, setEditTimeOfDay] = useState('')
  const [editActive, setEditActive] = useState(true)

  function startEdit(s: NotificationSchedule) {
    setEditingId(s.id)
    setEditDayOfWeek(s.dayOfWeek)
    setEditTimeOfDay(s.timeOfDay)
    setEditActive(s.isActive)
  }

  function handleSave() {
    if (!editingId) return
    startTransition(async () => {
      try {
        await updateNotificationScheduleAction(editingId, {
          dayOfWeek: editDayOfWeek,
          timeOfDay: editTimeOfDay,
          isActive: editActive,
        })
        toast.success('Notifikationsplan opdateret')
        setEditingId(null)
      } catch {
        toast.error('Kunne ikke opdatere notifikationsplan')
      }
    })
  }

  function handleToggle(s: NotificationSchedule) {
    startTransition(async () => {
      try {
        await updateNotificationScheduleAction(s.id, {
          isActive: !s.isActive,
        })
        toast.success(
          s.isActive ? 'Notifikation deaktiveret' : 'Notifikation aktiveret'
        )
      } catch {
        toast.error('Kunne ikke opdatere status')
      }
    })
  }

  if (schedules.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          Ingen notifikationsplaner konfigureret endnu. Kør seed-scriptet for
          at oprette standardplaner.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Notifikationsplaner styrer hvornår de forskellige typer beskeder
        sendes til brugerne. Typerne er faste og kan ikke tilføjes eller
        slettes, kun redigeres.
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Ugedag</TableHead>
              <TableHead>Tidspunkt</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) =>
              editingId === s.id ? (
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {TYPE_LABELS[s.notificationType] ?? s.notificationType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={String(editDayOfWeek)}
                      onValueChange={(v) => setEditDayOfWeek(Number(v))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DAY_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={editTimeOfDay}
                      onChange={(e) => setEditTimeOfDay(e.target.value)}
                      className="w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editActive}
                        onCheckedChange={setEditActive}
                      />
                      <Label className="text-xs">
                        {editActive ? 'Aktiv' : 'Inaktiv'}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={handleSave}
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
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {TYPE_LABELS[s.notificationType] ?? s.notificationType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {DAY_LABELS[s.dayOfWeek] ?? `Dag ${s.dayOfWeek}`}
                  </TableCell>
                  <TableCell>{s.timeOfDay}</TableCell>
                  <TableCell>
                    <Switch
                      checked={s.isActive}
                      onCheckedChange={() => handleToggle(s)}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => startEdit(s)}
                      disabled={isPending}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
