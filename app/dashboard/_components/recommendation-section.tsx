import Link from 'next/link'
import { ArrowRight, Map, BookOpen, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Recommendation {
  type: string
  id: string
  title: string
  description: string | null
  slug: string
  priority: number
}

interface RecommendationSectionProps {
  recommendations: Recommendation[]
}

export function RecommendationSection({
  recommendations,
}: RecommendationSectionProps) {
  if (recommendations.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Anbefalet til dig</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {recommendations.map((rec) => {
          const href =
            rec.type === 'JOURNEY'
              ? `/journeys/${rec.slug}`
              : rec.type === 'ROOM'
                ? `/community/${rec.slug}`
                : `/products/${rec.slug}`
          const Icon =
            rec.type === 'JOURNEY' ? Map : rec.type === 'ROOM' ? MessageCircle : BookOpen
          const badgeLabel =
            rec.type === 'JOURNEY' ? 'Forløb' : rec.type === 'ROOM' ? 'Fællesskab' : 'Kursus'
          const ctaLabel =
            rec.type === 'JOURNEY' ? 'Start forløb' : rec.type === 'ROOM' ? 'Deltag i samtalen' : 'Se kursus'

          return (
            <Card key={rec.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {badgeLabel}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base">{rec.title}</CardTitle>
                {rec.description && (
                  <CardDescription className="line-clamp-2">
                    {rec.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline" className="w-full min-h-[44px]" size="sm">
                  <Link href={href}>
                    {ctaLabel}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
