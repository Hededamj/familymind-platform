'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowLeft } from 'lucide-react'
import { AdminNav } from './admin-nav'

export function AdminMobileNav({ brandName }: { brandName: string }) {
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
          className="flex size-10 items-center justify-center rounded-lg text-[var(--foreground)] transition-colors hover:bg-white/60"
          aria-label="Åbn menu"
        >
          <Menu className="size-5" />
        </button>

        <span className="font-serif text-lg tracking-wide text-[var(--foreground)]">
          {brandName}
        </span>

        {/* Empty spacer for centering */}
        <div className="size-10" />
      </div>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="relative flex h-full w-[280px] flex-col border-r border-[var(--color-border)] bg-[var(--color-sand)]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pb-2 pt-8">
              <div>
                <Link href="/admin" className="group block" onClick={() => setOpen(false)}>
                  <span className="font-serif text-xl tracking-wide text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--foreground)]/70">
                    {brandName}
                  </span>
                </Link>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/20">
                  ADMIN
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex size-10 items-center justify-center rounded-lg text-[var(--foreground)]/50 transition-colors hover:bg-white/60 hover:text-[var(--foreground)]"
                aria-label="Luk menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Back link */}
            <div className="px-5 pb-2 pt-3">
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--accent)] transition-all duration-200 hover:bg-white/60"
                onClick={() => setOpen(false)}
              >
                <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
                Tilbage til min side
              </Link>
            </div>

            <div className="mx-7 border-b border-[var(--foreground)]/5" />

            {/* Nav */}
            <AdminNav />
          </div>
        </div>
      )}
    </>
  )
}
