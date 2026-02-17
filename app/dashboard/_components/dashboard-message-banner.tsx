import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardMessageBannerProps {
  heading: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export function DashboardMessageBanner({
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: DashboardMessageBannerProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
        {heading}
      </h2>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {ctaLabel && ctaUrl && (
        <Button asChild className="mt-4" size="lg">
          <Link href={ctaUrl}>
            {ctaLabel}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
