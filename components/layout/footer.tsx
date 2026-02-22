'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type FooterProps = {
  brandName: string
  description: string | null
  contactUrl: string | null
  footerCopyright: string | null
  footerLinks: { label: string; url: string }[] | null
}

export function Footer({
  brandName,
  description,
  contactUrl,
  footerCopyright,
  footerLinks,
}: FooterProps) {
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

  // Extract display hostname from contactUrl
  const contactDisplay = contactUrl
    ? contactUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <span className="font-serif text-xl">{brandName}</span>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/browse" className="hover:text-foreground">
                  Udforsk indhold
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-foreground">
                  Abonnement
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Mit dashboard
                </Link>
              </li>
              {footerLinks
                ?.filter((link) => link.url.startsWith('/') || link.url.startsWith('https://'))
                .map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Kontakt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {contactUrl && contactDisplay && (
                <li>
                  <a
                    href={contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    {contactDisplay}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}{' '}
          {footerCopyright || `${brandName}. Alle rettigheder forbeholdes.`}
        </div>
      </div>
    </footer>
  )
}
