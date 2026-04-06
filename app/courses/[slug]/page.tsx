import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProduct } from '@/lib/services/product.service'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getCourseProgress } from '@/lib/services/progress.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, PlayCircle, FileText, Headphones, Type, CheckCircle } from 'lucide-react'

type LandingPageConfig = {
  subtitle?: string
  benefits?: string[]
  testimonials?: Array<{ name: string; text: string }>
  faq?: Array<{ question: string; answer: string }>
  ctaText?: string
  ctaUrl?: string
}

const mediaTypeIcons: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  AUDIO: Headphones,
  TEXT: Type,
}

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product || !product.isActive || product.type !== 'COURSE') {
    notFound()
  }

  // Tjek om brugeren har adgang
  const user = await getCurrentUser()
  let hasAccess = false
  let courseProgress: Awaited<ReturnType<typeof getCourseProgress>> | null = null

  if (user) {
    const entitlements = await getUserEntitlements(user.id)
    hasAccess = entitlements.some((e) => e.productId === product.id)
    if (hasAccess) {
      courseProgress = await getCourseProgress(user.id, product.id)
    }
  }

  // Brugeren har adgang — vis kursusindhold med lektioner
  if (hasAccess && courseProgress) {
    const progressLessons = courseProgress.lessons
    const completedIds = new Set(
      progressLessons.filter((l) => l.completed).map((l) => l.contentUnitId)
    )
    const lessons = product.courseLessons
      ?.sort((a: any, b: any) => a.position - b.position) ?? []

    const productSlug = product!.slug

    function LessonRow({ lesson }: { lesson: any }) {
      const isCompleted = completedIds.has(lesson.contentUnit.id)
      const Icon = mediaTypeIcons[lesson.contentUnit.mediaType] ?? PlayCircle
      const typeLabel = lesson.contentUnit.mediaType === 'VIDEO' ? 'Video'
        : lesson.contentUnit.mediaType === 'PDF' ? 'PDF'
        : lesson.contentUnit.mediaType === 'AUDIO' ? 'Lyd' : 'Tekst'
      return (
        <Link
          key={lesson.id}
          href={`/content/${lesson.contentUnit.slug}?course=${productSlug}`}
          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
        >
          {isCompleted ? (
            <CheckCircle className="size-5 text-green-600 shrink-0" />
          ) : (
            <Icon className="size-5 text-muted-foreground shrink-0" />
          )}
          <span className={`text-sm ${isCompleted ? 'text-muted-foreground' : 'font-medium'}`}>
            {lesson.contentUnit.title}
          </span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {typeLabel}
          </Badge>
        </Link>
      )
    }

    return (
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/dashboard/courses"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Mine forløb
          </Link>

          <h1 className="mb-2 font-serif text-2xl sm:text-3xl">{product.title}</h1>
          {product.description && (
            <p className="mb-6 text-muted-foreground">{product.description}</p>
          )}

          <div className="mb-6 text-sm text-muted-foreground">
            {courseProgress.completedLessons} af {courseProgress.totalLessons} lektioner gennemført
          </div>

          {product.modules && product.modules.length > 0 ? (
            <div className="space-y-6">
              {product.modules.sort((a: any, b: any) => a.position - b.position).map((module: any, i: number) => {
                const moduleLessons = lessons.filter((l: any) => l.moduleId === module.id)
                return (
                  <div key={module.id} className="rounded-xl border">
                    <div className="border-b px-5 py-4">
                      <h2 className="font-medium">
                        <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                        {module.title}
                      </h2>
                    </div>
                    <div className="divide-y">
                      {moduleLessons.map((lesson: any) => (
                        <LessonRow key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border divide-y">
              {lessons.map((lesson: any) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Brugeren har IKKE adgang — vis landingsside
  const lp = (product.landingPage as LandingPageConfig) || {}
  const rawCtaUrl = lp.ctaUrl || ''
  const ctaUrl = rawCtaUrl.startsWith('/') ? rawCtaUrl : `/products/${product.slug}`
  const ctaText = lp.ctaText || 'Kom i gang'
  const moduleCount = product.modules?.length || 0
  const lessonCount = product.courseLessons?.length || 0

  return (
    <div>
      {/* Hero */}
      <section className="bg-sand px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
            Kursus{moduleCount > 0 ? ` · ${moduleCount} moduler` : ''}{lessonCount > 0 ? ` · ${lessonCount} lektioner` : ''}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl">{product.title}</h1>
          {lp.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {lp.subtitle}
            </p>
          )}
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-xl px-8 text-base">
              <Link href={ctaUrl}>{ctaText}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cover image */}
      {product.coverImageUrl && (
        <section className="px-4 sm:px-8">
          <div className="mx-auto -mt-8 max-w-4xl overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={product.coverImageUrl}
              alt={product.title}
              width={1200}
              height={675}
              className="h-full w-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Benefits */}
      {lp.benefits && lp.benefits.length > 0 && (
        <section className="px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center font-serif text-2xl">
              Hvad du lærer
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {lp.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="size-3.5 text-primary" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Module overview */}
      {product.modules && product.modules.length > 0 && (
        <section className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center font-serif text-2xl">
              Kursusindhold
            </h2>
            <div className="space-y-4">
              {product.modules.map((module: any, i: number) => {
                const moduleLessonCount = product.courseLessons?.filter((l: any) => l.moduleId === module.id).length || 0
                return (
                  <div key={module.id} className="flex items-start gap-4 rounded-2xl border border-border p-5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-medium">{module.title}</h3>
                      {module.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {moduleLessonCount} {moduleLessonCount === 1 ? 'lektion' : 'lektioner'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {product.description && (
        <section className="px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {lp.faq && lp.faq.length > 0 && (
        <section className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center font-serif text-2xl">
              Ofte stillede spørgsmål
            </h2>
            <div className="space-y-4">
              {lp.faq.map((item, i) => (
                <details key={i} className="rounded-xl border border-border p-5">
                  <summary className="cursor-pointer font-medium">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="mb-4 font-serif text-2xl">Klar til at komme i gang?</h2>
          <Button asChild size="lg" className="rounded-xl px-8 text-base">
            <Link href={ctaUrl}>{ctaText}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
