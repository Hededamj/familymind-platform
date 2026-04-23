import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Building2,
  Palette,
  Plug,
  ClipboardList,
  Target,
  SmilePlus,
  MessageSquare,
  Mail,
  Bell,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react'

const settingsSections = [
  {
    href: '/admin/settings/general',
    title: 'Generelt',
    description: 'Firmaoplysninger til juridiske dokumenter og e-mails',
    icon: Building2,
  },
  {
    href: '/admin/settings/branding',
    title: 'Branding',
    description: 'Logo, farver, landing page-indhold og email-indstillinger',
    icon: Palette,
  },
  {
    href: '/admin/settings/integrations',
    title: 'Integrationer',
    description: 'Google Analytics, Meta Pixel og Stripe-forbindelse',
    icon: Plug,
  },
  {
    href: '/admin/settings/onboarding',
    title: 'Onboarding Quiz',
    description:
      'Konfigurer spørgsmål og svarmuligheder til onboarding-quizzen',
    icon: ClipboardList,
  },
  {
    href: '/admin/settings/recommendations',
    title: 'Anbefalingsregler',
    description:
      'Opsæt regler for automatiske anbefalinger baseret på tags og alder',
    icon: Target,
  },
  {
    href: '/admin/settings/checkins',
    title: 'Check-in Muligheder',
    description: 'Administrer de daglige check-in svarmuligheder',
    icon: SmilePlus,
  },
  {
    href: '/admin/settings/dashboard',
    title: 'Dashboard Beskeder',
    description:
      'Rediger tilstandsbaserede beskeder på brugerens dashboard',
    icon: MessageSquare,
  },
  {
    href: '/admin/settings/emails',
    title: 'E-mail Skabeloner',
    description:
      'Rediger emnelinjer, indhold og status for e-mail skabeloner',
    icon: Mail,
  },
  {
    href: '/admin/settings/notifications',
    title: 'Notifikationsplan',
    description:
      'Konfigurer hvornår notifikationer sendes til brugerne',
    icon: Bell,
  },
  {
    href: '/admin/settings/reengagement',
    title: 'Genaktiveringsniveauer',
    description:
      'Konfigurer hvornår og hvordan inaktive brugere kontaktes',
    icon: RefreshCw,
  },
  {
    href: '/admin/settings/milestones',
    title: 'Milepælsdefinitioner',
    description:
      'Konfigurer milepælene og deres fejringsmeddelelser',
    icon: Trophy,
  },
  {
    href: '/admin/settings/community',
    title: 'Fællesskab',
    description:
      'Notifikationer, digest, indeksering og prompt-kø for fællesskabet',
    icon: Users,
  },
]

export default async function SettingsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indstillinger</h1>
        <p className="text-muted-foreground">
          Konfigurer systemindstillinger for platformen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <section.icon className="size-5 text-muted-foreground" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
