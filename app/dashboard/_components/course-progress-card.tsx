import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface CourseProgressCardProps {
  product: {
    id: string
    title: string
    slug: string
  }
  lessons: Array<{
    slug: string
    completed: boolean
  }>
  completedLessons: number
  totalLessons: number
  percentComplete: number
}

export function CourseProgressCard({
  product,
  lessons,
  completedLessons,
  totalLessons,
  percentComplete,
}: CourseProgressCardProps) {
  // Find next incomplete lesson
  const nextLesson = lessons.find((l) => !l.completed)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{product.title}</CardTitle>
        <CardDescription>
          {completedLessons} af {totalLessons} lektioner
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fremskridt</span>
            <span className="font-medium">{percentComplete}%</span>
          </div>
          <Progress value={percentComplete} />
        </div>

        {/* Continue button */}
        {nextLesson ? (
          <Button asChild className="w-full" size="sm">
            <Link href={`/content/${nextLesson.slug}`}>
              Fortsæt
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href={`/products/${product.slug}`}>Se kursus</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
