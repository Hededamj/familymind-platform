import Link from 'next/link'
import {
  User,
  Bell,
  CreditCard,
  TrendingUp,
  Settings,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { LogoutButton } from './_components/logout-button'

const menuItems = [
  { icon: User, label: 'Rediger profil', href: '/dashboard/settings' },
  { icon: Bell, label: 'Notifikationer', href: '/dashboard/notifications' },
  { icon: CreditCard, label: 'Abonnement', href: '/dashboard/settings#subscription' },
  { icon: TrendingUp, label: 'Min fremgang', href: '/dashboard/progress' },
  { icon: Settings, label: 'Indstillinger', href: '/dashboard/settings' },
]

export default async function ProfilePage() {
  const user = await requireAuth()

  const displayName = user.name || user.email.split('@')[0]
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(user.createdAt).toLocaleDateString('da-DK', {
    month: 'short',
    year: 'numeric',
  })

  const isPrivileged = user.role === 'ADMIN' || user.role === 'MODERATOR'

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-lg">
        {/* Avatar + user info */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary">
            <span className="text-xl font-semibold text-primary-foreground">
              {initials}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-xl">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Medlem siden {memberSince}
          </p>
        </div>

        {/* Separator */}
        <div className="my-6 border-t border-border" />

        {/* Menu items */}
        <nav className="space-y-1">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 hover:bg-[var(--color-sand)] transition-colors"
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="flex-1 text-foreground">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground/40" />
            </Link>
          ))}
        </nav>

        {/* Admin/Moderator section */}
        {isPrivileged && (
          <>
            <div className="my-4 border-t border-border" />
            <nav>
              <Link
                href="/admin"
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 hover:bg-[var(--color-sand)] transition-colors"
              >
                <Shield className="size-5 text-muted-foreground" />
                <span className="flex-1 text-foreground">Administration</span>
                <ChevronRight className="size-4 text-muted-foreground/40" />
              </Link>
            </nav>
          </>
        )}

        {/* Logout section */}
        <div className="my-4 border-t border-border" />
        <LogoutButton />
      </div>
    </div>
  )
}
