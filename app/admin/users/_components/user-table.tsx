'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BulkActions } from './bulk-actions'

type Tag = { id: string; name: string; color: string }

type UserRow = {
  id: string
  name: string | null
  email: string
  lastActiveAt: Date | string | null
  createdAt: Date | string
  tags: Array<{ tag: Tag }>
  entitlements: Array<{ id: string; status: string; source: string }>
}

function computeUserStatus(
  user: UserRow
): 'trial' | 'active' | 'inactive' | 'churned' {
  const hasActiveEntitlement = user.entitlements.length > 0
  if (!hasActiveEntitlement) {
    // No active entitlements — the server-side filter handles trial vs churned distinction
    return 'trial'
  }
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000)
  const lastActive = user.lastActiveAt
    ? new Date(user.lastActiveAt)
    : null
  if (lastActive && lastActive >= fourteenDaysAgo) {
    return 'active'
  }
  return 'inactive'
}

const statusConfig = {
  trial: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  active: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inaktiv', className: 'bg-yellow-100 text-yellow-800' },
  churned: { label: 'Frafaldne', className: 'bg-red-100 text-red-800' },
} as const

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Aldrig'
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Lige nu'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} timer`

  const days = Math.floor(hours / 24)
  return `${days} dage`
}

export function UserTable({
  users,
  total,
  page,
  totalPages,
  tags,
}: {
  users: UserRow[]
  total: number
  page: number
  totalPages: number
  tags: Tag[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  function paginationHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(targetPage))
    return `/admin/users?${params.toString()}`
  }

  const allSelected = users.length > 0 && selectedIds.length === users.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map((u) => u.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                  aria-label="Vælg alle"
                />
              </TableHead>
              <TableHead>Navn</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Sidst aktiv</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Ingen brugere fundet
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const status = computeUserStatus(user)
                const config = statusConfig[status]
                return (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={() => toggleOne(user.id)}
                        aria-label={`Vælg ${user.name ?? user.email}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name ?? '-'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={config.className}
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.tags.map((ut) => (
                          <Badge
                            key={ut.tag.id}
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: ut.tag.color,
                              color: ut.tag.color,
                            }}
                          >
                            {ut.tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatRelativeTime(user.lastActiveAt)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} brugere i alt
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Side {page} af {totalPages}
          </span>
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={paginationHref(page - 1)}>Forrige</Link>
            </Button>
          )}
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={paginationHref(page + 1)}>Næste</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedUserIds={selectedIds}
          tags={tags}
          onClearSelection={() => setSelectedIds([])}
        />
      )}
    </div>
  )
}
