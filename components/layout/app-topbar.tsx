'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'

const topLevelRoutes = ['/dashboard', '/community', '/browse']

type Props = {
  brandName: string
  hasUnread?: boolean
}

export function AppTopbar({ brandName, hasUnread }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const isTopLevel = topLevelRoutes.some(
    (route) => pathname === route || pathname === route + '/'
  )

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
      {/* Left side */}
      {isTopLevel ? (
        <span className="font-serif text-lg text-[var(--foreground)]">
          {brandName}
        </span>
      ) : (
        <button
          onClick={() => router.back()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center"
          aria-label="Gå tilbage"
        >
          <ArrowLeft className="size-5 text-[var(--foreground)]" />
        </button>
      )}

      {/* Right side */}
      <Link
        href="/dashboard/notifications"
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center"
        aria-label="Notifikationer"
      >
        <Bell className="size-5 text-[var(--foreground)]" />
        {hasUnread && (
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[var(--accent)]" />
        )}
      </Link>
    </header>
  )
}
