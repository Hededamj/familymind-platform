'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  // Don't show footer on admin, dashboard, onboarding, or journey day pages
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/onboarding') ||
    (pathname?.includes('/day/'))
  ) {
    return null
  }

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <span className="font-serif text-xl">FamilyMind</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Din strukturerede forældreguide — evidensbaseret
              viden og praktiske værktøjer til hele familien.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/browse" className="hover:text-foreground">
                  Opdag indhold
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-foreground">
                  Abonnement
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Min side
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Kontakt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://mettehummel.dk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  mettehummel.dk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FamilyMind. Alle rettigheder forbeholdes.
        </div>
      </div>
    </footer>
  )
}
