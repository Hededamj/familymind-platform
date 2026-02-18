'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
} from '@/app/dashboard/notifications/actions'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  actionUrl: string | null
  readAt: Date | null
  createdAt: Date
}

function relativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'Lige nu'
  if (diffMin < 60) return `${diffMin} min. siden`
  if (diffH < 24) return `${diffH} t. siden`
  if (diffD === 1) return 'I g\u00e5r'
  if (diffD < 7) return `${diffD} dage siden`
  return new Date(date).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getNotificationsAction(15)
        setNotifications(result.notifications)
        setUnreadCount(result.unreadCount)
      } catch {
        // Silently fail — user might not be authenticated yet
      }
    })
  }, [])

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  // Poll every 60 seconds for new notifications
  useEffect(() => {
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  function handleNotificationClick(notification: Notification) {
    if (!notification.readAt) {
      startTransition(async () => {
        await markAsReadAction(notification.id)
        refresh()
      })
    }
    if (notification.actionUrl) {
      setOpen(false)
      router.push(notification.actionUrl)
    }
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllAsReadAction()
      refresh()
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={`Notifikationer${unreadCount > 0 ? ` (${unreadCount} ulæste)` : ''}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifikationer
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <Check className="mr-1 size-3" />
              )}
              Mark\u00e9r alle som l\u00e6st
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Ingen notifikationer endnu
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                  notification.readAt ? 'opacity-60' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-sm leading-tight ${
                      notification.readAt ? 'font-normal' : 'font-semibold'
                    }`}
                  >
                    {notification.title}
                  </span>
                  {!notification.readAt && (
                    <span className="mt-1 size-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.body}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {relativeTime(notification.createdAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
