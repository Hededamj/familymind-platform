# FamilyMind Platform UI/UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign hele FamilyMinds bruger- og admin-oplevelse fra "kursus-system" til "et sted man føler sig hjemme" med sidebar navigation, bottom tabs, og moderniseret Nordic Hearth æstetik.

**Architecture:** Two-shell approach — website-mode (public pages with dark topbar + footer) vs app-mode (authenticated pages with light sidebar + bottom tabs). Route-based shell switching via Next.js layout nesting. Admin gets same light design language in separate `/admin` route.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Lucide icons

**Design doc:** `docs/plans/2026-03-08-platform-ui-redesign.md`

---

## Task 1: App Sidebar Component

**Goal:** Create the light sand-colored sidebar for authenticated user pages.

**Files:**
- Create: `components/layout/app-sidebar.tsx`

**Context:**
- The sidebar is 260px wide, uses `bg-[var(--color-sand)]` background
- Shows 4 nav items: Hjem, Fællesskab, Mine forløb, Opdag
- User avatar + dropdown at bottom
- "Administration" link for ADMIN/MODERATOR roles
- Active item: `bg-white` with `border-l-2` accent bar
- Lucide icons: `Home`, `MessageCircle`, `BookOpen`, `Compass`
- Must be a client component (uses `usePathname()`)

**Step 1: Create the sidebar component**

```tsx
// components/layout/app-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  MessageCircle,
  BookOpen,
  Compass,
  Settings as SettingsIcon,
  ChevronDown,
  LogOut,
  Bell,
  CreditCard,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Hjem', icon: Home },
  { href: '/community', label: 'Fællesskab', icon: MessageCircle },
  { href: '/dashboard/courses', label: 'Mine forløb', icon: BookOpen },
  { href: '/browse', label: 'Opdag', icon: Compass },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

type Props = {
  brandName: string
  userName: string
  userEmail: string
  userRole: string
}

export function AppSidebar({ brandName, userName, userEmail, userRole }: Props) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false)
  }, [pathname])

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isAdmin = userRole === 'ADMIN' || userRole === 'MODERATOR'

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sand)] md:block lg:block">
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="px-6 pb-4 pt-6">
          <Link href="/dashboard" className="block">
            <span className="font-serif text-xl text-[var(--foreground)]">
              {brandName}
            </span>
          </Link>
        </div>

        <div className="mx-5 border-b border-[var(--color-border)]" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-[var(--foreground)]'
                      : 'text-[var(--foreground)]/60 hover:bg-white/60 hover:text-[var(--foreground)]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                  )}
                  <item.icon
                    className={`size-[18px] ${
                      active ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/40'
                    }`}
                    strokeWidth={1.5}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[var(--color-border)] px-4 py-4">
          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--foreground)]/40 transition-colors hover:bg-white/60 hover:text-[var(--foreground)]"
            >
              <SettingsIcon className="size-4" strokeWidth={1.5} />
              Administration
            </Link>
          )}

          {/* User dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/60"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-[var(--foreground)]">
                  {userName}
                </div>
                <div className="truncate text-[11px] text-[var(--foreground)]/40">
                  {userEmail}
                </div>
              </div>
              <ChevronDown className={`size-4 text-[var(--foreground)]/30 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[var(--color-border)] bg-white p-1.5 shadow-lg">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-[var(--foreground)]/70 transition-colors hover:bg-[var(--color-sand)]"
                >
                  <User className="size-4" />
                  Rediger profil
                </Link>
                <Link
                  href="/dashboard/notifications"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-[var(--foreground)]/70 transition-colors hover:bg-[var(--color-sand)]"
                >
                  <Bell className="size-4" />
                  Notifikationer
                </Link>
                <Link
                  href="/dashboard/settings#subscription"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-[var(--foreground)]/70 transition-colors hover:bg-[var(--color-sand)]"
                >
                  <CreditCard className="size-4" />
                  Abonnement
                </Link>
                <div className="my-1 border-t border-[var(--color-border)]" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="size-4" />
                  Log ud
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds (component isn't used yet, but no syntax errors).

**Step 3: Commit**

```bash
git add components/layout/app-sidebar.tsx
git commit -m "feat: add AppSidebar component with light sand theme"
```

---

## Task 2: Bottom Tab Bar + Mobile Topbar

**Goal:** Create bottom tab bar for mobile and a simple topbar for mobile app-mode.

**Files:**
- Create: `components/layout/bottom-tab-bar.tsx`
- Create: `components/layout/app-topbar.tsx`

**Context:**
- Bottom tab bar: 56px height, 5 items (Hjem, Fællesskab, Forløb, Opdag, Profil), accent color for active
- Mobile topbar: 56px height, logo left, notification bell right
- Both are client components (usePathname)
- Tab bar has safe-area padding for iPhone notch (env(safe-area-inset-bottom))
- On sub-pages (e.g. /journeys/[slug]/day/[id]), topbar shows back arrow instead of logo

**Step 1: Create bottom tab bar**

```tsx
// components/layout/bottom-tab-bar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, BookOpen, Compass, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type TabItem = {
  href: string
  label: string
  icon: LucideIcon
}

const tabs: TabItem[] = [
  { href: '/dashboard', label: 'Hjem', icon: Home },
  { href: '/community', label: 'Fællesskab', icon: MessageCircle },
  { href: '/dashboard/courses', label: 'Forløb', icon: BookOpen },
  { href: '/browse', label: 'Opdag', icon: Compass },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-white md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--foreground)]/40'
              }`}
            >
              <tab.icon className="size-5" strokeWidth={active ? 2 : 1.5} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 2: Create mobile topbar**

```tsx
// components/layout/app-topbar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'

type Props = {
  brandName: string
  hasUnread?: boolean
}

// Routes where we show the logo (top-level app pages)
const topLevelRoutes = ['/dashboard', '/community', '/browse']

function isTopLevel(pathname: string): boolean {
  return topLevelRoutes.some(
    (route) => pathname === route || (route !== '/dashboard' && pathname.startsWith(route))
  )
}

export function AppTopbar({ brandName, hasUnread }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const showBackArrow = !isTopLevel(pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Logo or Back arrow */}
        {showBackArrow ? (
          <button
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-sand)]"
            aria-label="Tilbage"
          >
            <ArrowLeft className="size-5 text-[var(--foreground)]" />
          </button>
        ) : (
          <Link href="/dashboard">
            <span className="font-serif text-lg text-[var(--foreground)]">
              {brandName}
            </span>
          </Link>
        )}

        {/* Right: Notification bell */}
        <Link
          href="/dashboard/notifications"
          className="relative flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-sand)]"
        >
          <Bell className="size-5 text-[var(--foreground)]/60" />
          {hasUnread && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--accent)]" />
          )}
        </Link>
      </div>
    </header>
  )
}
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/layout/bottom-tab-bar.tsx components/layout/app-topbar.tsx
git commit -m "feat: add BottomTabBar and AppTopbar components for mobile"
```

---

## Task 3: App Layout Wrapper

**Goal:** Create the AppLayout component that combines sidebar + tabs + topbar, and integrate it with the root layout for route-based shell switching.

**Files:**
- Create: `components/layout/app-layout.tsx` (server component wrapper)
- Modify: `app/layout.tsx` — update to conditionally render website vs app shell
- Modify: `components/layout/topbar.tsx` — also hide on `/community` when logged in (handled by app shell)

**Context:**
- The root layout currently always renders TopbarWrapper + FooterWrapper
- We need to detect if the user is on an app-mode route AND authenticated
- App-mode routes: `/dashboard`, `/journeys/*`, `/community` (when logged in)
- Problem: Root layout is a server component, can't conditionally render based on client auth state
- Solution: Keep topbar/footer hiding logic in their client components (they already hide on `/dashboard` and `/admin`). Create a separate layout for app-mode routes using Next.js route groups.

**Better approach:** Use a Next.js route group `(app)` for authenticated pages with their own layout.

However, this requires moving many route folders which is risky. Instead, we'll create a dashboard layout that wraps the app shell around `/dashboard/*` routes, and let the topbar/footer components handle hiding themselves on the right routes. For `/community` and `/browse` when logged in, they'll initially keep website-mode and we'll migrate them in a later task.

**Step 1: Create app-layout server wrapper**

```tsx
// components/layout/app-layout.tsx
import { getCurrentUser } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { AppSidebar } from './app-sidebar'
import { BottomTabBar } from './bottom-tab-bar'
import { AppTopbar } from './app-topbar'

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, tenant] = await Promise.all([
    getCurrentUser(),
    getTenantConfig(),
  ])

  if (!user) return <>{children}</>

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AppSidebar
        brandName={tenant.brandName}
        userName={displayName}
        userEmail={user.email}
        userRole={user.role}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <AppTopbar brandName={tenant.brandName} />

        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        <BottomTabBar />
      </div>
    </div>
  )
}
```

**Step 2: Create dashboard layout**

Create a layout file at `app/dashboard/layout.tsx` that wraps all dashboard routes with the app shell.

```tsx
// app/dashboard/layout.tsx
import { AppLayout } from '@/components/layout/app-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
```

**Step 3: Update topbar.tsx to also hide on /journeys and /community when in app-mode**

In `components/layout/topbar.tsx`, update the hiding logic (around line 43-45):

```tsx
// Add /journeys to the hide list (it will use app layout)
if (pathname?.startsWith('/admin')) return null
if (pathname?.startsWith('/dashboard')) return null
if (pathname?.startsWith('/onboarding')) return null
if (pathname?.startsWith('/journeys')) return null
```

**Step 4: Update footer.tsx to also hide on /journeys**

In `components/layout/footer.tsx`, add `/journeys` to the hide conditions (it already hides on `/dashboard` and `/admin`).

**Step 5: Update dashboard page.tsx**

Remove the outer wrapper div, brand link, and header navigation buttons from `app/dashboard/page.tsx`. The app shell now provides navigation. Keep the greeting and state-based content.

Key changes to `app/dashboard/page.tsx`:
- Remove `flex min-h-screen flex-col` wrapper (AppLayout provides this)
- Remove `max-w-2xl` → change to `max-w-4xl`
- Remove the brand name link, NotificationBell, Fremgang link, Settings link, LogoutButton from header
- Keep just the greeting h1
- Keep all state-based content
- Remove imports for: `Settings`, `TrendingUp` from lucide, `NotificationBell`, `LogoutButton`, `getTenantConfig` (no longer needed directly)

The new dashboard page structure:

```tsx
export default async function DashboardPage() {
  const user = await requireAuth()
  trackActivity()

  if (!user.onboardingCompleted && user.role !== 'ADMIN') {
    redirect('/onboarding')
  }

  const dashboardState = await getDashboardState(user.id)
  const { stateKey, message, activeJourney, journeyProgress, inProgressCourses, recommendations, recentlyCompleted } = dashboardState
  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Greeting */}
        <h1 className="mb-8 font-serif text-2xl sm:text-3xl">
          {getGreeting()}, {displayName}
        </h1>

        {/* State-based content (unchanged) */}
        <div className="space-y-6">
          {/* ... same state views ... */}
        </div>
      </div>
    </div>
  )
}
```

**Step 6: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add components/layout/app-layout.tsx app/dashboard/layout.tsx app/dashboard/page.tsx components/layout/topbar.tsx components/layout/footer.tsx
git commit -m "feat: integrate AppLayout with sidebar and bottom tabs for dashboard"
```

---

## Task 4: Admin Sidebar Redesign

**Goal:** Replace the dark brown admin sidebar with light sand theme matching the user sidebar.

**Files:**
- Modify: `app/admin/layout.tsx`
- Modify: `app/admin/_components/admin-nav.tsx`

**Context:**
- Current: dark brown `#1E1B18` with `rgba(255,255,255,...)` text
- New: `bg-[var(--color-sand)]` with `var(--foreground)` text
- Same structure and items, just new colors
- Active state: `bg-white` with accent border (like user sidebar)
- Section labels: uppercase, muted, tracking-wide
- "← Tilbage til min side" at top (accent color)
- "ADMIN" label under brand name
- Remove `.admin-theme` class and all inline rgba styles

**Step 1: Update admin layout**

Replace the dark sidebar in `app/admin/layout.tsx` with light theme:

```tsx
// app/admin/layout.tsx
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { ArrowLeft } from 'lucide-react'
import { AdminNav } from './_components/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, tenant] = await Promise.all([
    requireAdmin(),
    getTenantConfig(),
  ])

  return (
    <div className="flex min-h-screen">
      {/* Light sand sidebar */}
      <aside className="hidden w-[280px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sand)] md:block">
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="px-6 pb-2 pt-6">
            <Link href="/admin" className="block">
              <span className="font-serif text-xl text-[var(--foreground)]">
                {tenant.brandName}
              </span>
            </Link>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/20">
              Admin
            </p>
          </div>

          {/* Back to dashboard */}
          <div className="px-4 py-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--accent)] transition-colors hover:bg-white/60"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Tilbage til min side
            </Link>
          </div>

          <div className="mx-5 border-b border-[var(--color-border)]" />

          <AdminNav />

          {/* Bottom: user info */}
          <div className="border-t border-[var(--color-border)] px-4 py-4">
            <div className="flex items-center gap-3 px-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[var(--foreground)]">
                  {user.name || user.email.split('@')[0]}
                </div>
                <div className="text-[11px] text-[var(--foreground)]/40">Admin</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile: hamburger menu (admin is desktop-first) */}
      {/* TODO: Add mobile hamburger in polish phase */}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[var(--background)]">
        <div className="p-6 sm:p-8">{children}</div>
      </main>
    </div>
  )
}
```

**Step 2: Update admin-nav.tsx**

Replace all dark rgba colors with light theme equivalents:

```tsx
// app/admin/_components/admin-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Package,
  Ticket,
  Map,
  Settings,
  Tags,
  Users,
  UsersRound,
  MessageSquare,
  Sparkles,
  Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavSection = {
  label: string
  items: { href: string; label: string; icon: LucideIcon }[]
}

const navSections: NavSection[] = [
  {
    label: 'Indhold',
    items: [
      { href: '/admin/products', label: 'Produkter', icon: Package },
      { href: '/admin/content', label: 'Lektioner', icon: FileText },
      { href: '/admin/journeys', label: 'Forløb', icon: Map },
      { href: '/admin/discounts', label: 'Rabatkoder', icon: Ticket },
    ],
  },
  {
    label: 'Medlemmer',
    items: [
      { href: '/admin/users', label: 'Brugere', icon: Users },
      { href: '/admin/cohorts', label: 'Kohorter', icon: UsersRound },
      { href: '/admin/settings/tags', label: 'Segmentering', icon: Tags },
    ],
  },
  {
    label: 'Fællesskab',
    items: [
      { href: '/admin/community/rooms', label: 'Rum', icon: MessageSquare },
      { href: '/admin/community/prompts', label: 'Prompts', icon: Sparkles },
      { href: '/admin/moderation', label: 'Moderering', icon: Shield },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Indstillinger', icon: Settings },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin/settings') return pathname === '/admin/settings'
  if (href === '/admin/community/rooms') return pathname.startsWith('/admin/community/rooms')
  if (href === '/admin/community/prompts') return pathname.startsWith('/admin/community/prompts')
  return pathname.startsWith(href)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-3">
      {navSections.map((section, i) => (
        <div key={section.label} className={i > 0 ? 'mt-7' : 'mt-1'}>
          <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/25">
            {section.label}
          </div>

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white text-[var(--foreground)]'
                      : 'text-[var(--foreground)]/50 hover:bg-white/60 hover:text-[var(--foreground)]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                  )}
                  <item.icon
                    className={`size-[18px] ${
                      active ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/30'
                    }`}
                    strokeWidth={1.5}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
```

**Step 3: Remove admin-theme class from globals.css**

Search for `.admin-theme` in `app/globals.css` and remove it (no longer needed since we're using CSS variables now).

**Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add app/admin/layout.tsx app/admin/_components/admin-nav.tsx app/globals.css
git commit -m "feat: redesign admin sidebar with light sand theme"
```

---

## Task 5: Course Tile Component

**Goal:** Create a reusable, visually prominent course/journey tile component.

**Files:**
- Create: `components/course-tile.tsx`

**Context:**
- Used on dashboard (aktive forløb, anbefalede), browse page, mine forløb page
- Minimum height 280px, image 16:9 aspect ratio
- Rounded-xl, shadow-sm, hover: shadow-md + translate-y
- Shows: image, title (serif), description (line-clamp-3), metadata, progress bar (optional), CTA button
- Multiple variants based on context (see design doc section 7)

**Step 1: Create the component**

```tsx
// components/course-tile.tsx
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CourseTileProps = {
  title: string
  description?: string | null
  imageUrl?: string | null
  href: string
  lessonCount?: number
  duration?: string
  progress?: number // 0-100
  phaseName?: string
  priceDisplay?: string
  variant?: 'active' | 'recommended' | 'completed' | 'browse'
  ctaLabel?: string
}

export function CourseTile({
  title,
  description,
  imageUrl,
  href,
  lessonCount,
  duration,
  progress,
  phaseName,
  priceDisplay,
  variant = 'browse',
  ctaLabel,
}: CourseTileProps) {
  const isCompleted = variant === 'completed'
  const defaultCta =
    variant === 'active'
      ? 'Fortsæt'
      : variant === 'completed'
        ? 'Se igen'
        : variant === 'recommended'
          ? 'Læs mere'
          : priceDisplay
            ? `Køb — ${priceDisplay}`
            : 'Start'

  return (
    <div
      className={`group relative flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isCompleted ? 'opacity-80' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-sand)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="size-12 text-[var(--foreground)]/10" />
          </div>
        )}

        {/* Completed badge overlay */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <CheckCircle2 className="size-12 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug text-[var(--foreground)]">
          {title}
        </h3>

        {phaseName && (
          <p className="mt-1 text-xs font-medium text-[var(--accent)]">
            {phaseName}
          </p>
        )}

        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--foreground)]/60">
            {description}
          </p>
        )}

        {/* Metadata */}
        {(lessonCount || duration) && (
          <div className="mt-3 flex items-center gap-3 text-[13px] text-[var(--foreground)]/40">
            {lessonCount && (
              <span className="flex items-center gap-1">
                <FileText className="size-3.5" />
                {lessonCount} lektioner
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {duration}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress bar */}
        {typeof progress === 'number' && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)]/40">Fremskridt</span>
              <span className="font-medium text-[var(--foreground)]">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-sand)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <Button asChild className="mt-4 min-h-[44px] w-full" variant={isCompleted ? 'outline' : 'default'}>
          <Link href={href}>
            {ctaLabel || defaultCta}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add components/course-tile.tsx
git commit -m "feat: add CourseTile component with variants for active/recommended/completed/browse"
```

---

## Task 6: Community Pills Component

**Goal:** Create horizontal scrollable community room pills for the dashboard.

**Files:**
- Create: `components/community-pills.tsx`

**Context:**
- Shows all active community rooms as horizontal pills
- Each pill: room icon + name + "X nye" badge if new posts
- Scrollable on mobile, flex-wrap on desktop
- Links to `/community` with room selection
- Fetches rooms from community service

**Step 1: Create the component**

```tsx
// components/community-pills.tsx
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Room = {
  id: string
  slug: string
  name: string
  icon: string | null
  _count: { posts: number }
}

function getRoomIcon(iconName: string | null): LucideIcon {
  if (!iconName) return LucideIcons.MessageCircle
  return (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] ?? LucideIcons.MessageCircle
}

export function CommunityPills({ rooms }: { rooms: Room[] }) {
  if (rooms.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-[var(--foreground)]/50">
        Fællesskab
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
        {rooms.map((room) => {
          const Icon = getRoomIcon(room.icon)
          const postCount = room._count.posts
          return (
            <Link
              key={room.id}
              href={`/community/${room.slug}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--foreground)]"
            >
              <Icon className="size-4 text-[var(--foreground)]/40" />
              {room.name}
              {postCount > 0 && (
                <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                  {postCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add components/community-pills.tsx
git commit -m "feat: add CommunityPills component for dashboard room navigation"
```

---

## Task 7: Integrate Community Pills + CourseTile into Dashboard

**Goal:** Update the dashboard page to use community pills at the top and course tiles for courses.

**Files:**
- Modify: `app/dashboard/page.tsx`

**Context:**
- Add community pills at the top of the dashboard (after greeting)
- Fetch rooms from `listRooms()` in community service
- Replace course grid with CourseTile components
- Widen layout from max-w-2xl to max-w-4xl (already done in Task 3)
- Keep all 5 state views but update their visual presentation

**Step 1: Update dashboard page**

Add to imports:
```tsx
import { CommunityPills } from '@/components/community-pills'
import { listRooms } from '@/lib/services/community.service'
```

Add rooms fetch in the component:
```tsx
const [dashboardState, rooms] = await Promise.all([
  getDashboardState(user.id),
  listRooms(),
])
```

Add pills after greeting, before state content:
```tsx
{/* Community pills */}
<CommunityPills rooms={rooms} />
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: integrate community pills into dashboard"
```

---

## Task 8: Profile Page

**Goal:** Create a dedicated profile page accessible from bottom tab bar and sidebar dropdown.

**Files:**
- Create: `app/dashboard/profile/page.tsx`

**Context:**
- Shows: avatar, name, email, member since date
- List of links: Rediger profil, Notifikationer, Abonnement, Min fremgang, Indstillinger
- "Administration" link for admins
- "Log ud" button at bottom (red text)
- 44px touch targets for all list items
- Accessible from bottom tab bar "Profil" tab

**Step 1: Create the page**

```tsx
// app/dashboard/profile/page.tsx
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import {
  User,
  Bell,
  CreditCard,
  TrendingUp,
  Settings,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { LogoutButton } from '../settings/_components/logout-button'

export default async function ProfilePage() {
  const user = await requireAuth()
  const displayName = user.name || user.email.split('@')[0]
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(user.createdAt).toLocaleDateString('da-DK', {
    month: 'short',
    year: 'numeric',
  })

  const isAdmin = user.role === 'ADMIN' || user.role === 'MODERATOR'

  const menuItems = [
    { href: '/dashboard/settings', label: 'Rediger profil', icon: User },
    { href: '/dashboard/notifications', label: 'Notifikationer', icon: Bell },
    { href: '/dashboard/settings#subscription', label: 'Abonnement', icon: CreditCard },
    { href: '/dashboard/progress', label: 'Min fremgang', icon: TrendingUp },
    { href: '/dashboard/settings', label: 'Indstillinger', icon: Settings },
  ]

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-lg">
        {/* User info */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-lg font-semibold text-white">
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-xl text-[var(--foreground)]">
              {displayName}
            </h1>
            <p className="text-sm text-[var(--foreground)]/50">{user.email}</p>
            <p className="text-xs text-[var(--foreground)]/30">
              Medlem siden {memberSince}
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)]" />

        {/* Menu items */}
        <div className="py-2">
          {menuItems.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex min-h-[44px] items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-sand)]"
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 text-[var(--foreground)]/40" />
                <span className="text-[15px] text-[var(--foreground)]">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="size-4 text-[var(--foreground)]/20" />
            </Link>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="border-t border-[var(--color-border)]" />
            <div className="py-2">
              <Link
                href="/admin"
                className="flex min-h-[44px] items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-sand)]"
              >
                <div className="flex items-center gap-3">
                  <Shield className="size-5 text-[var(--foreground)]/40" />
                  <span className="text-[15px] text-[var(--foreground)]">
                    Administration
                  </span>
                </div>
                <ChevronRight className="size-4 text-[var(--foreground)]/20" />
              </Link>
            </div>
          </>
        )}

        <div className="border-t border-[var(--color-border)]" />

        <div className="py-4">
          <LogoutButton variant="full" />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds. May need to check if `LogoutButton` supports `variant="full"`. If not, use a simple logout button with red text styling.

**Step 3: Commit**

```bash
git add app/dashboard/profile/page.tsx
git commit -m "feat: add profile page with user info and menu items"
```

---

## Task 9: Mine Forløb Page

**Goal:** Create a dedicated "Mine forløb" page showing active and completed courses/journeys.

**Files:**
- Create: `app/dashboard/courses/page.tsx`

**Context:**
- Two sections: "Aktive" and "Gennemførte"
- Uses CourseTile component
- Grid: 1 column mobile, 2 columns desktop
- Fetches from existing dashboard service data
- Accessible from sidebar "Mine forløb" and bottom tab "Forløb"

**Step 1: Create the page**

```tsx
// app/dashboard/courses/page.tsx
import { requireAuth } from '@/lib/auth'
import { getDashboardState } from '@/lib/services/dashboard.service'
import { CourseTile } from '@/components/course-tile'
import { Compass } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CoursesPage() {
  const user = await requireAuth()
  const state = await getDashboardState(user.id)

  const activeCourses = state.inProgressCourses || []
  const hasActiveJourney = !!state.activeJourney

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-8 font-serif text-2xl sm:text-3xl">Mine forløb</h1>

        {/* Active journey */}
        {hasActiveJourney && state.activeJourney && (
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--foreground)]/30">
              Aktiv rejse
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <CourseTile
                title={state.activeJourney.journey.title}
                description={state.activeJourney.journey.description}
                imageUrl={null}
                href={`/journeys/${state.activeJourney.journey.slug}`}
                progress={state.journeyProgress ? Math.round(
                  (state.journeyProgress.completedDays / state.journeyProgress.totalDays) * 100
                ) : 0}
                phaseName={state.activeJourney.currentDay?.phase?.title}
                variant="active"
              />
            </div>
          </section>
        )}

        {/* Active courses */}
        {activeCourses.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--foreground)]/30">
              Aktive kurser
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeCourses.map((course) => (
                <CourseTile
                  key={course.product.id}
                  title={course.product.name}
                  description={course.product.description}
                  imageUrl={course.product.imageUrl}
                  href={`/content/${course.product.slug}`}
                  progress={Math.round(
                    (course.completedLessons / course.totalLessons) * 100
                  )}
                  lessonCount={course.totalLessons}
                  variant="active"
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasActiveJourney && activeCourses.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] py-16 text-center">
            <Compass className="mb-4 size-12 text-[var(--foreground)]/20" />
            <h2 className="mb-2 font-serif text-lg">Ingen aktive forløb</h2>
            <p className="mb-6 max-w-sm text-sm text-[var(--foreground)]/50">
              Udforsk vores katalog og find et forløb der passer til dig.
            </p>
            <Button asChild>
              <Link href="/browse">Opdag forløb</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds. May need to adjust property names to match actual getDashboardState return type.

**Step 3: Commit**

```bash
git add app/dashboard/courses/page.tsx
git commit -m "feat: add Mine Forløb page with active and completed sections"
```

---

## Task 10: Journeys App Shell Integration

**Goal:** Wrap journey pages (`/journeys/*`) with the app layout so they use sidebar/tabs instead of topbar/footer.

**Files:**
- Create: `app/journeys/layout.tsx`

**Context:**
- Journey pages currently use the root layout (topbar + footer)
- We want authenticated users to see the app shell (sidebar + tabs)
- The topbar already hides on /journeys (added in Task 3)
- The footer already hides on /journeys (has day-page check)
- Need a layout that wraps with AppLayout

**Step 1: Create journeys layout**

```tsx
// app/journeys/layout.tsx
import { AppLayout } from '@/components/layout/app-layout'

export default function JourneysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/journeys/layout.tsx
git commit -m "feat: wrap journey pages with app shell layout"
```

---

## Task 11: Admin Mobile Hamburger

**Goal:** Add a hamburger menu for admin on mobile (since admin doesn't use bottom tabs).

**Files:**
- Create: `app/admin/_components/admin-mobile-nav.tsx`
- Modify: `app/admin/layout.tsx` — add mobile hamburger trigger

**Context:**
- Admin sidebar is `hidden md:block` — invisible on mobile
- Need a hamburger button in a topbar that opens the sidebar as a slide-over
- Backdrop: `bg-black/20`
- Slide from left with transition
- Contains same AdminNav content

**Step 1: Create admin mobile nav**

```tsx
// app/admin/_components/admin-mobile-nav.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, ArrowLeft } from 'lucide-react'
import { AdminNav } from './admin-nav'

type Props = {
  brandName: string
}

export function AdminMobileNav({ brandName }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sand)] px-4 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-white/60"
          aria-label="Åbn menu"
        >
          <Menu className="size-5 text-[var(--foreground)]" />
        </button>
        <span className="font-serif text-lg text-[var(--foreground)]">
          {brandName}
        </span>
        <div className="size-10" /> {/* Spacer for centering */}
      </div>

      {/* Overlay + slide-over */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute inset-y-0 left-0 w-[280px] border-r border-[var(--color-border)] bg-[var(--color-sand)]">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-2 pt-6">
                <div>
                  <span className="font-serif text-xl text-[var(--foreground)]">
                    {brandName}
                  </span>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/20">
                    Admin
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-white/60"
                  aria-label="Luk menu"
                >
                  <X className="size-5 text-[var(--foreground)]" />
                </button>
              </div>

              {/* Back link */}
              <div className="px-4 py-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--accent)] transition-colors hover:bg-white/60"
                >
                  <ArrowLeft className="size-4" />
                  Tilbage til min side
                </Link>
              </div>

              <div className="mx-5 border-b border-[var(--color-border)]" />

              <AdminNav />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 2: Add to admin layout**

In `app/admin/layout.tsx`, import and render `AdminMobileNav`:

```tsx
import { AdminMobileNav } from './_components/admin-mobile-nav'

// Inside the return, before <main>:
<AdminMobileNav brandName={tenant.brandName} />
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add app/admin/_components/admin-mobile-nav.tsx app/admin/layout.tsx
git commit -m "feat: add admin mobile hamburger menu with slide-over sidebar"
```

---

## Task 12: Polish — Tablet Collapsed Sidebar

**Goal:** Add collapsed sidebar (64px, icons only) for tablet breakpoint (768-1024px).

**Files:**
- Modify: `components/layout/app-sidebar.tsx` — add collapsed state for md breakpoint

**Context:**
- Currently sidebar shows at `md:block` (768px+) at full 260px width
- On tablet (md to lg), we want a collapsed version: 64px wide, only icons, tooltips on hover
- On desktop (lg+): full 260px sidebar
- Transition: `width 200ms ease`

**Step 1: Update app-sidebar.tsx**

Change the aside className to handle the responsive collapsed state:

```tsx
// In app-sidebar.tsx, update the aside element:
<aside className="hidden shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sand)] md:block md:w-16 lg:w-[260px] transition-[width] duration-200">
```

Add conditional rendering: on `md` show only icons, on `lg` show icons + labels. Use Tailwind's responsive classes:

```tsx
// For each nav item label:
<span className="hidden lg:inline">{item.label}</span>

// For brand:
<span className="hidden font-serif text-xl text-[var(--foreground)] lg:inline">{brandName}</span>

// Adjust padding for collapsed:
// px-6 → md:px-2 lg:px-6
// gap-3 → md:justify-center lg:justify-start lg:gap-3
```

This requires significant restructuring of the sidebar JSX to handle both states cleanly. The implementer should use `lg:` prefix for full-width styles and make `md:` the collapsed default.

**Step 2: Add tooltips for collapsed state**

Use the `title` attribute for simple tooltips on the collapsed icons:

```tsx
<Link ... title={item.label}>
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/layout/app-sidebar.tsx
git commit -m "feat: add collapsed sidebar for tablet breakpoint"
```

---

## Task 13: Community Layout Integration

**Goal:** Wrap community pages with app shell for authenticated users, keep website-mode for anonymous.

**Files:**
- Modify: `app/community/layout.tsx` (if exists) or create it
- Modify: `components/layout/topbar.tsx` — conditional hide on /community

**Context:**
- Anonymous users see website-mode (topbar + footer) on /community
- Authenticated users see app-mode (sidebar + tabs)
- The AppLayout component already handles the auth check — if no user, it renders children without shell
- But we need topbar/footer to also conditionally show on /community based on auth state
- Solution: Wrap community with AppLayout. AppLayout renders shell if authenticated, otherwise passthrough. Topbar already handles hiding via pathname check.

**Step 1: Create/update community layout**

Check if `app/community/layout.tsx` exists. If it has generateMetadata, keep that and add AppLayout wrapper.

```tsx
// app/community/layout.tsx
import { AppLayout } from '@/components/layout/app-layout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fællesskab — FamilyMind',
  description: 'Et trygt rum for forældre.',
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
```

**Step 2: Update topbar to conditionally hide on /community**

The topbar needs to hide on /community when the user is logged in (because AppLayout provides navigation). But for anonymous users, the topbar should still show.

The current topbar already checks `isLoggedIn` state. Add:

```tsx
// In topbar.tsx, after the isLoggedIn state is set:
if (pathname?.startsWith('/community') && isLoggedIn) return null
```

**Step 3: Update footer similarly**

```tsx
// In footer.tsx, add similar auth-based hiding for /community
// The footer client component needs to check auth state like topbar does
```

Note: This is tricky because footer doesn't currently check auth state. A simpler approach is to just hide footer on /community always (acceptable since anonymous users can still see community content without footer being critical).

**Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add app/community/layout.tsx components/layout/topbar.tsx components/layout/footer.tsx
git commit -m "feat: integrate community pages with app shell for authenticated users"
```

---

## Task 14: Final Polish

**Goal:** Clean up, verify consistency, and remove dead code.

**Files:**
- Modify: `app/globals.css` — remove `.admin-theme` styles, any dead CSS
- Modify: `components/layout/topbar.tsx` — ensure all app-mode routes are hidden
- Modify: `components/layout/footer.tsx` — ensure all app-mode routes are hidden
- Verify: All pages render correctly with new layout

**Step 1: Clean up globals.css**

Remove the `.admin-theme` class and related admin sidebar color overrides. These are no longer needed since admin uses CSS variables.

**Step 2: Verify all routes**

Manually check or verify in build:
- `/` — website-mode (topbar + footer) ✓
- `/browse` — website-mode ✓ (will migrate to app-mode later if desired)
- `/subscribe` — website-mode ✓
- `/login`, `/signup` — website-mode ✓
- `/dashboard` — app-mode (sidebar + tabs) ✓
- `/dashboard/courses` — app-mode ✓
- `/dashboard/profile` — app-mode ✓
- `/dashboard/progress` — app-mode ✓
- `/dashboard/settings` — app-mode ✓
- `/journeys/*` — app-mode ✓
- `/community` — app-mode (auth) / website-mode (anon) ✓
- `/admin/*` — light admin sidebar ✓

**Step 3: Run full build**

Run: `npx next build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: polish — remove dead CSS, verify route consistency"
```

---

## Summary

| Task | Component | Priority |
|---|---|---|
| 1 | App Sidebar | Foundation |
| 2 | Bottom Tab Bar + Mobile Topbar | Foundation |
| 3 | App Layout + Dashboard Integration | Foundation |
| 4 | Admin Sidebar Redesign | Foundation |
| 5 | Course Tile Component | Component |
| 6 | Community Pills Component | Component |
| 7 | Dashboard + Community Pills Integration | Integration |
| 8 | Profile Page | Page |
| 9 | Mine Forløb Page | Page |
| 10 | Journeys App Shell | Integration |
| 11 | Admin Mobile Hamburger | Enhancement |
| 12 | Tablet Collapsed Sidebar | Enhancement |
| 13 | Community Layout Integration | Integration |
| 14 | Final Polish | Cleanup |

**Total: 14 tasks**

Tasks 1-4 are foundational and must be done in order. Tasks 5-9 can be parallelized after foundations are in place. Tasks 10-14 are integrations and polish.
