import Link from 'next/link'
import { ArrowRight, Map, BookOpen } from 'lucide-react'
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
          const isJourney = rec.type === 'JOURNEY'
          const href = isJourney
            ? `/journeys/${rec.slug}`
            : `/products/${rec.slug}`
          const Icon = isJourney ? Map : BookOpen

          return (
            <Card key={rec.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {isJourney ? 'Forløb' : 'Kursus'}
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
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href={href}>
                    {isJourney ? 'Start forløb' : 'Se kursus'}
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
