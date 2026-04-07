import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getProduct } from '@/lib/services/product.service'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getCourseProgress } from '@/lib/services/progress.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BuyButton } from './_components/buy-button'
import { ArrowLeft, ArrowRight, Check, Circle, CircleDot, Package } from 'lucide-react'

function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100)
}

function productTypeLabel(type: string): string {
  switch (type) {
    case 'COURSE':
      return 'Kursus'
    case 'SINGLE':
      return 'Enkeltindhold'
    case 'BUNDLE':
      return 'Pakke'
    case 'SUBSCRIPTION':
      return 'Abonnement'
    default:
      return type
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product || !product.isActive) {
    notFound()
  }

  const user = await getCurrentUser()

  // Check if user already owns this product
  let alreadyOwned = false
  if (user) {
    const entitlements = await getUserEntitlements(user.id)
    alreadyOwned = entitlements.some((e) => e.productId === product.id)
  }

  // Get course progress if user owns a course
  const courseProgress =
    alreadyOwned && user && product.type === 'COURSE'
      ? await getCourseProgress(user.id, product.id)
      : null

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage
        </Link>

        {/* Product header */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-3 rounded-full text-xs">
            {productTypeLabel(product.type)}
          </Badge>
          <h1 className="font-serif text-2xl sm:text-3xl">
            {product.title}
          </h1>
          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {product.description}
            </p>
          )}
        </div>

        {/* Cover image */}
        {product.coverImageUrl && (
          <div className="mb-6 aspect-video overflow-hidden rounded-2xl">
            <Image
              src={product.coverImageUrl}
              alt={product.title}
              width={800}
              height={450}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Price */}
        <div className="mb-6">
          <p className="font-serif text-3xl">
            {formatPrice(product.priceAmountCents, product.priceCurrency)}
            {product.type === 'SUBSCRIPTION' && (
              <span className="text-base font-normal text-muted-foreground">
                {' '}
                /måned
              </span>
            )}
          </p>
        </div>

        <div className="mb-6 border-t border-border" />

        {/* Course content with modules */}
        {product.type === 'COURSE' && product.courseLessons.length > 0 && (
          <div className="mb-6 space-y-6">
            <div className="mb-4">
              <h2 className="font-serif text-lg">Indhold i kurset</h2>
              {courseProgress && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {courseProgress.completedLessons} af {courseProgress.totalLessons} lektioner
                    </span>
                    <span className="font-medium">{courseProgress.percentComplete}%</span>
                  </div>
                  <Progress value={courseProgress.percentComplete} className="h-2" />
                </div>
              )}
            </div>

            {product.modules && product.modules.length > 0 ? (
              /* Module-grouped view */
              product.modules.map((module, mi) => {
                const moduleLessons = product.courseLessons
                  .filter((l: any) => l.moduleId === module.id)
                  .sort((a: any, b: any) => a.position - b.position)

                if (moduleLessons.length === 0) return null

                return (
                  <div key={module.id}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {mi + 1}
                      </span>
                      {module.title}
                    </h3>
                    {module.description && (
                      <p className="mb-3 text-xs text-muted-foreground">{module.description}</p>
                    )}
                    <div className="rounded-2xl border border-border bg-white">
                      <ul className="divide-y divide-border">
                        {courseProgress
                          ? moduleLessons.map((lesson: any, li: number) => {
                              const progressLesson = courseProgress.lessons.find(
                                (pl: any) => pl.contentUnitId === lesson.contentUnitId || pl.slug === lesson.contentUnit?.slug
                              )
                              return (
                                <li key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                                  {progressLesson?.completed ? (
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
                                      <Check className="size-3.5" />
                                    </div>
                                  ) : progressLesson?.started ? (
                                    <CircleDot className="size-6 shrink-0 text-primary" />
                                  ) : (
                                    <Circle className="size-6 shrink-0 text-muted-foreground/40" />
                                  )}
                                  <Link
                                    href={`/content/${lesson.contentUnit?.slug || progressLesson?.slug}?course=${product.slug}`}
                                    className="flex-1 text-sm font-medium hover:text-primary"
                                  >
                                    {lesson.contentUnit?.title || progressLesson?.title}
                                  </Link>
                                </li>
                              )
                            })
                          : moduleLessons.map((lesson: any, li: number) => (
                              <li key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-medium">
                                  {li + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{lesson.contentUnit.title}</p>
                                </div>
                              </li>
                            ))}
                      </ul>
                    </div>
                  </div>
                )
              })
            ) : (
              /* Flat list fallback */
              <div className="rounded-2xl border border-border bg-white">
                <ul className="divide-y divide-border">
                  {courseProgress
                    ? courseProgress.lessons.map((lesson: any, index: number) => (
                        <li key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                          {lesson.completed ? (
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
                              <Check className="size-3.5" />
                            </div>
                          ) : lesson.started ? (
                            <CircleDot className="size-6 shrink-0 text-primary" />
                          ) : (
                            <Circle className="size-6 shrink-0 text-muted-foreground/40" />
                          )}
                          <Link
                            href={`/content/${lesson.slug}?course=${product.slug}`}
                            className="flex-1 text-sm font-medium hover:text-primary"
                          >
                            {index + 1}. {lesson.title}
                          </Link>
                        </li>
                      ))
                    : product.courseLessons.map((lesson: any, index: number) => (
                        <li key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{lesson.contentUnit.title}</p>
                          </div>
                        </li>
                      ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Guided journey link */}
        {product.type === 'COURSE' && product.journeys && product.journeys.length > 0 && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="mb-1 font-serif text-lg">Guidet forløb</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Følg et dagligt forløb der guider dig gennem indholdet med øvelser og refleksion.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/journeys/${product.journeys[0].slug}`}>
                Se guidet forløb
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Bundle items */}
        {product.type === 'BUNDLE' && product.bundleItems.length > 0 && (
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="font-serif text-lg">Inkluderet i pakken</h2>
              <p className="text-sm text-muted-foreground">
                {product.bundleItems.length}{' '}
                {product.bundleItems.length === 1 ? 'produkt' : 'produkter'}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white">
              <ul className="divide-y divide-border">
                {product.bundleItems.map((item) => {
                  const title = item.includedProduct?.title ?? item.includedContentUnit?.title
                  const description = item.includedProduct?.description ?? item.includedContentUnit?.description
                  if (!title) return null
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand">
                        <Package className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{title}</p>
                        {description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {description}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}

        {/* Purchase section */}
        <div className="mt-8">
          {alreadyOwned ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-center">
              <p className="mb-4 text-sm font-medium text-success">
                Du har allerede adgang til dette produkt.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard">Gå til dashboard</Link>
              </Button>
            </div>
          ) : user ? (
            <BuyButton productId={product.id} productType={product.type} />
          ) : (
            <Button asChild className="w-full rounded-xl" size="lg">
              <Link href={`/login?redirect=/products/${product.slug}`}>
                Log ind for at købe
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
