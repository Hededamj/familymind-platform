import Link from 'next/link'
import { Settings, BookOpen, ArrowRight } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getUserInProgressCourses } from '@/lib/services/progress.service'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Redirect non-admin users who haven't completed onboarding
  if (!user.onboardingCompleted && user.role !== 'ADMIN') {
    redirect('/onboarding')
  }

  const courses = await getUserInProgressCourses(user.id)

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Hej, {displayName}!
            </h1>
            <p className="mt-1 text-muted-foreground">
              Velkommen tilbage til FamilyMind
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="size-4" />
            <span className="hidden sm:inline">Indstillinger</span>
          </Link>
        </div>

        {/* In-progress courses */}
        {courses.length > 0 ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Dine kurser</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => {
                // Find next incomplete lesson
                const nextLesson = course.lessons.find((l) => !l.completed)

                return (
                  <Card key={course.product.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {course.product.title}
                      </CardTitle>
                      <CardDescription>
                        {course.completedLessons} af {course.totalLessons}{' '}
                        lektioner
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Fremskridt
                          </span>
                          <span className="font-medium">
                            {course.percentComplete}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${course.percentComplete}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Continue button */}
                      {nextLesson ? (
                        <Button asChild className="w-full" size="sm">
                          <Link href={`/content/${nextLesson.slug}`}>
                            Forts\u00e6t
                            <ArrowRight className="ml-2 size-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Link
                            href={`/products/${course.product.slug}`}
                          >
                            Se kursus
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <BookOpen className="mb-4 size-12 text-muted-foreground/50" />
              <h2 className="mb-2 text-lg font-semibold">
                Ingen kurser endnu
              </h2>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Udforsk vores kurser og start din l\u00e6ringsrejse i dag.
              </p>
              <Button asChild>
                <Link href="/browse">
                  Udforsk vores kurser
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
