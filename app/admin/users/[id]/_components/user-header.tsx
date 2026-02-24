'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import {
  updateUserRoleAction,
  addTagToUsersAction,
  removeTagFromUsersAction,
} from '../../actions'
import { computeUserStatus } from '@/lib/compute-user-status'
import type { getUserDetail } from '@/lib/services/admin-user.service'
import type { listTags } from '@/lib/services/admin-tag.service'

type User = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>
type Tag = Awaited<ReturnType<typeof listTags>>[number]

const statusConfig = {
  trial: { label: 'Prøve', className: 'bg-blue-100 text-blue-800' },
  active: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inaktiv', className: 'bg-yellow-100 text-yellow-800' },
  churned: { label: 'Frafaldne', className: 'bg-red-100 text-red-800' },
} as const

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function UserHeader({
  user,
  allTags,
}: {
  user: User
  allTags: Tag[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const status = computeUserStatus(user)
  const config = statusConfig[status]

  const userTagIds = new Set(user.tags.map((ut) => ut.tag.id))
  const availableTags = allTags.filter((t) => !userTagIds.has(t.id))

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      try {
        await updateUserRoleAction(user.id, {
          role: newRole as 'USER' | 'ADMIN',
        })
        toast.success('Rolle opdateret')
        router.refresh()
      } catch {
        toast.error('Kunne ikke opdatere rolle')
      }
    })
  }

  function handleRemoveTag(tagId: string) {
    startTransition(async () => {
      try {
        await removeTagFromUsersAction(tagId, [user.id])
        toast.success('Tag fjernet')
        router.refresh()
      } catch {
        toast.error('Kunne ikke fjerne tag')
      }
    })
  }

  function handleAddTag(tagId: string) {
    startTransition(async () => {
      try {
        await addTagToUsersAction(tagId, [user.id])
        toast.success('Tag tilføjet')
        router.refresh()
      } catch {
        toast.error('Kunne ikke tilføje tag')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user.name ?? 'Anonym bruger'}
          </h1>
          <p className="text-muted-foreground">
            {user.email} &middot; Oprettet {formatDate(user.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className={config.className}>
            {config.label}
          </Badge>
          <Select
            value={user.role}
            onValueChange={handleRoleChange}
            disabled={isPending}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">USER</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {user.tags.map((ut) => (
          <Badge
            key={ut.tag.id}
            variant="outline"
            className="gap-1 pr-1"
            style={{ borderColor: ut.tag.color, color: ut.tag.color }}
          >
            {ut.tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(ut.tag.id)}
              disabled={isPending}
              className="ml-1 rounded-sm p-0.5 hover:bg-muted"
              aria-label={`Fjern tag ${ut.tag.name}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

        {availableTags.length > 0 && (
          <Select
            value=""
            onValueChange={handleAddTag}
            disabled={isPending}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue placeholder="Tilføj tag" />
            </SelectTrigger>
            <SelectContent>
              {availableTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <span
                    className="mr-1.5 inline-block size-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
