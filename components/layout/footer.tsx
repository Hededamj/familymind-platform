'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useConsent } from '@/components/consent/consent-provider'

type Props = {
  brandName: string
  logoUrl: string | null
  tagline: string | null
  description: string | null
  contactUrl: string | null
  footerCopyright: string | null
  footerLinks: { label: string; url: string }[] | null
}

export function Footer({ brandName, logoUrl, tagline, description, contactUrl, footerCopyright, footerLinks }: Props) {
  const pathname = usePathname()
  const { setOpenSettings } = useConsent()

  // Don't show footer on admin, dashboard, onboarding, journeys, or journey day pages
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/journeys') ||
    pathname?.startsWith('/community') ||
    (pathname?.includes('/day/'))
  ) {
    return null
  }

  return (
    <footer className="bg-[#1A1A1A] text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src={logoUrl || '/images/logo.png'}
              alt={brandName}
              width={140}
              height={36}
              className="mb-3 h-8 w-auto"
            />
            <p className="text-sm leading-relaxed text-white/50">
              {description || tagline || ''}
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

          {/* Tenant links */}
          {footerLinks && footerLinks.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Links</h4>
              <ul className="space-y-2.5 text-sm">
                {footerLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target={link.url.startsWith('/') ? undefined : '_blank'}
                      rel={link.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                      className="transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {contactUrl && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Kontakt</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href={contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    {contactUrl.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              </ul>
            </div>
          )}

          {/* Juridisk */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Juridisk</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privatlivspolitik" className="transition-colors hover:text-white">
                  Privatlivspolitik
                </Link>
              </li>
              <li>
                <Link href="/cookiepolitik" className="transition-colors hover:text-white">
                  Cookiepolitik
                </Link>
              </li>
              <li>
                <Link href="/vilkaar" className="transition-colors hover:text-white">
                  Vilkår
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setOpenSettings(true)}
                  className="transition-colors hover:text-white"
                >
                  Cookieindstillinger
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} {footerCopyright || `${brandName}. Alle rettigheder forbeholdes.`}
        </div>
      </div>
    </footer>
  )
}
