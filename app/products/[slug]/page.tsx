import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProduct } from '@/lib/services/product.service'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getCourseProgress } from '@/lib/services/progress.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BuyButton } from './_components/buy-button'
import { ArrowLeft, Check, Circle, CircleDot, Package } from 'lucide-react'

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

        {/* Course lessons with progress */}
        {product.type === 'COURSE' && product.courseLessons.length > 0 && (
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="font-serif text-lg">Indhold i kurset</h2>
              <p className="text-sm text-muted-foreground">
                {courseProgress
                  ? `${courseProgress.completedLessons} af ${courseProgress.totalLessons} lektioner fuldført`
                  : `${product.courseLessons.length} ${product.courseLessons.length === 1 ? 'lektion' : 'lektioner'}`}
              </p>
              {courseProgress && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fremskridt</span>
                    <span className="font-medium">{courseProgress.percentComplete}%</span>
                  </div>
                  <Progress value={courseProgress.percentComplete} className="h-2" />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white">
              <ul className="divide-y divide-border">
                {courseProgress
                  ? courseProgress.lessons.map((lesson, index) => (
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
                          href={`/content/${lesson.slug}`}
                          className="flex-1 text-sm font-medium hover:text-primary"
                        >
                          {index + 1}. {lesson.title}
                        </Link>
                      </li>
                    ))
                  : product.courseLessons.map((lesson, index) => (
                      <li key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {lesson.contentUnit.title}
                          </p>
                          {lesson.contentUnit.durationMinutes && (
                            <p className="text-xs text-muted-foreground">
                              {lesson.contentUnit.durationMinutes} min.
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
              </ul>
            </div>
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
                {product.bundleItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.includedProduct.title}
                      </p>
                      {item.includedProduct.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.includedProduct.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
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
