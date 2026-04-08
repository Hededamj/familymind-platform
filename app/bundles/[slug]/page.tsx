import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { getBundle } from '@/lib/services/bundle.service'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getCourseProgress } from '@/lib/services/progress.service'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BundlePricingCard } from './_components/BundlePricingCard'

export default async function BundleLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const bundle = await getBundle(slug)
  if (!bundle || !bundle.isActive) notFound()

  const user = await getCurrentUser()

  let hasAccess = false
  if (user) {
    const entitlements = await getUserEntitlements(user.id)
    hasAccess = entitlements.some((e) => e.bundleId === bundle.id)
  }

  // STATE A: bruger har adgang
  if (hasAccess && user) {
    const progressList = await Promise.all(
      bundle.courses.map(async (bc) => ({
        course: bc.course,
        progress: await getCourseProgress(user.id, bc.course.id),
      }))
    )

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage til dashboard
        </Link>

        <div className="mb-8">
          <Badge className="mb-3">
            <Check className="mr-1 size-3" />
            Du har adgang til denne bundel
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{bundle.title}</h1>
          {bundle.description && (
            <p className="mt-2 text-muted-foreground">{bundle.description}</p>
          )}
        </div>

        <h2 className="mb-4 text-xl font-semibold">Inkluderede kurser</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {progressList.map(({ course, progress }) => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <Card className="h-full transition-colors hover:border-primary">
                {course.coverImageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={course.coverImageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress.completedLessons} af {progress.totalLessons} lektioner
                    </span>
                    <span className="font-medium">{progress.percentComplete}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress.percentComplete}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // STATE B: ingen adgang — landingsside
  const variants = bundle.priceVariants.filter((v) => v.isActive)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {bundle.coverImageUrl && (
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={bundle.coverImageUrl}
                alt={bundle.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight">{bundle.title}</h1>
          {bundle.description && (
            <p className="mt-4 text-lg text-muted-foreground">{bundle.description}</p>
          )}

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Inkluderede kurser</h2>
            <ul className="space-y-2">
              {bundle.courses.map((bc) => (
                <li key={bc.id} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <div className="font-medium">{bc.course.title}</div>
                    {bc.course.description && (
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {bc.course.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Vælg din plan</CardTitle>
            </CardHeader>
            <CardContent>
              <BundlePricingCard variants={variants} isLoggedIn={!!user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
