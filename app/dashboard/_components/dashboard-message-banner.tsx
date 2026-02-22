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
    <div className="rounded-2xl bg-sand p-6">
      <h2 className="font-serif text-xl sm:text-2xl">
        {heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {ctaLabel && ctaUrl && (
        <Button asChild className="mt-4 rounded-xl" size="lg">
          <Link href={ctaUrl}>
            {ctaLabel}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
