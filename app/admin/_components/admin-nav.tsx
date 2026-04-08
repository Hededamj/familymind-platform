'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Package,
  Layers,
  Ticket,
  Map,
  Settings,
  Tags,
  Users,
  UsersRound,
  MessageSquare,
  Sparkles,
  Shield,
  Info,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  tooltip?: string
}

type NavSection = {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Indsigt',
    items: [
      { href: '/admin/analytics', label: 'Økonomi & Vækst', icon: TrendingUp, tooltip: 'Sundhed, konvertering, økonomi og brugeradfærd' },
    ],
  },
  {
    label: 'Indhold',
    items: [
      { href: '/admin/courses', label: 'Kurser', icon: Package, tooltip: 'Opret og administrer kurser, moduler, lektioner og priser' },
      { href: '/admin/bundles', label: 'Bundler', icon: Layers, tooltip: 'Saml flere kurser i en pakke med fælles pris' },
      { href: '/admin/content', label: 'Lektioner', icon: FileText, tooltip: 'Individuelle indholdsstykker — video, tekst, øvelser' },
      { href: '/admin/journeys', label: 'Forløb', icon: Map, tooltip: 'Dagbaserede forløb der guider brugeren igennem et tema' },
      { href: '/admin/discounts', label: 'Rabatkoder', icon: Ticket, tooltip: 'Procentuelle eller faste rabatter synkroniseret med Stripe' },
    ],
  },
  {
    label: 'Medlemmer',
    items: [
      { href: '/admin/users', label: 'Brugere', icon: Users, tooltip: 'Se og administrer alle registrerede brugere' },
      { href: '/admin/cohorts', label: 'Kohorter', icon: UsersRound, tooltip: 'Grupper af brugere der følger samme forløb samtidig' },
      { href: '/admin/settings/tags', label: 'Segmentering', icon: Tags, tooltip: 'Tags til at kategorisere brugere — bruges til anbefalinger og filtrering' },
    ],
  },
  {
    label: 'Fællesskab',
    items: [
      { href: '/admin/community/rooms', label: 'Rum', icon: MessageSquare, tooltip: 'Åbne diskussionsrum i community-sektionen' },
      { href: '/admin/community/prompts', label: 'Prompts', icon: Sparkles, tooltip: 'Planlagte samtalestartere der postes automatisk i rum' },
      { href: '/admin/moderation', label: 'Moderering', icon: Shield, tooltip: 'Anmeldte indlæg og modereringshandlinger' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Indstillinger', icon: Settings, tooltip: 'Branding, onboarding, emails, anbefalinger og mere' },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin/analytics') return pathname.startsWith('/admin/analytics')
  if (href === '/admin/settings') return pathname === '/admin/settings'
  if (href === '/admin/community/rooms') return pathname.startsWith('/admin/community/rooms')
  if (href === '/admin/community/prompts') return pathname.startsWith('/admin/community/prompts')
  return pathname.startsWith(href)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="flex-1 overflow-y-auto px-5 py-3">
        {navSections.map((section, i) => (
          <div key={section.label} className={i > 0 ? 'mt-7' : 'mt-1'}>
            <div className="mb-3 px-3 text-[11px] font-medium uppercase tracking-widest text-[var(--foreground)]/25">
              {section.label}
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <div key={item.href} className="flex items-center">
                    <Link
                      href={item.href}
                      className={`
                        relative flex flex-1 items-center gap-3.5 rounded-lg px-3 py-2.5
                        text-[14px] font-medium transition-all duration-200
                        ${active
                          ? 'bg-white text-[var(--foreground)]'
                          : 'text-[var(--foreground)]/50 hover:bg-white/60 hover:text-[var(--foreground)]'
                        }
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                      )}
                      <item.icon
                        className={`size-[18px] ${active ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/30'}`}
                        strokeWidth={1.5}
                      />
                      {item.label}
                    </Link>
                    {item.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="shrink-0 rounded-full p-1 text-[var(--foreground)]/20 transition-colors hover:text-[var(--foreground)]/50"
                          >
                            <Info className="size-3.5" strokeWidth={1.5} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[220px] text-xs">
                          {item.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  )
}
