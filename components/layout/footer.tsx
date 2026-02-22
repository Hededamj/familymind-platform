'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <footer className="bg-[#1A1A1A] text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Image
              src="/images/logo.png"
              alt="FamilyMind"
              width={140}
              height={36}
              className="mb-3 h-8 w-auto"
            />
            <p className="text-sm leading-relaxed text-white/50">
              Din strukturerede forældreguide — evidensbaseret
              viden og praktiske værktøjer til hele familien.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/browse" className="transition-colors hover:text-white">
                  Opdag indhold
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="transition-colors hover:text-white">
                  Abonnement
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-white">
                  Min side
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Kontakt</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://mettehummel.dk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  mettehummel.dk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} FamilyMind. Alle rettigheder forbeholdes.
        </div>
      </div>
    </footer>
  )
}
