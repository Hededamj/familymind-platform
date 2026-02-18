import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProduct } from '@/lib/services/product.service'
import { getCurrentUser } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/services/entitlement.service'
import { getCourseProgress } from '@/lib/services/progress.service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { BuyButton } from './_components/buy-button'
import { Check, Circle, CircleDot } from 'lucide-react'

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
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Tilbage
        </Link>

        {/* Product header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{productTypeLabel(product.type)}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {product.title}
          </h1>
          {product.description && (
            <p className="mt-3 text-lg text-muted-foreground">
              {product.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mb-6">
          <p className="text-2xl font-semibold">
            {formatPrice(product.priceAmountCents, product.priceCurrency)}
            {product.type === 'SUBSCRIPTION' && (
              <span className="text-base font-normal text-muted-foreground">
                {' '}
                / måned
              </span>
            )}
          </p>
        </div>

        <Separator className="mb-6" />

        {/* Course lessons with progress */}
        {product.type === 'COURSE' && product.courseLessons.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Indhold i kurset</CardTitle>
              <CardDescription>
                {courseProgress
                  ? `${courseProgress.completedLessons} af ${courseProgress.totalLessons} lektioner f\u00e6rdig`
                  : `${product.courseLessons.length} ${product.courseLessons.length === 1 ? 'lektion' : 'lektioner'}`}
              </CardDescription>
              {/* Progress bar */}
              {courseProgress && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fremskridt</span>
                    <span className="font-medium">{courseProgress.percentComplete}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${courseProgress.percentComplete}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {courseProgress
                  ? courseProgress.lessons.map((lesson, index) => (
                      <li key={lesson.id} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                          {lesson.completed ? (
                            <Check className="size-5 text-green-600" />
                          ) : lesson.started ? (
                            <CircleDot className="size-5 text-blue-500" />
                          ) : (
                            <Circle className="size-5 text-muted-foreground" />
                          )}
                        </span>
                        <div className="flex-1">
                          <Link
                            href={`/content/${lesson.slug}`}
                            className="font-medium hover:underline"
                          >
                            {index + 1}. {lesson.title}
                          </Link>
                        </div>
                      </li>
                    ))
                  : product.courseLessons.map((lesson, index) => (
                      <li key={lesson.id} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">
                            {lesson.contentUnit.title}
                          </p>
                          {lesson.contentUnit.durationMinutes && (
                            <p className="text-sm text-muted-foreground">
                              {lesson.contentUnit.durationMinutes} min.
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Bundle items */}
        {product.type === 'BUNDLE' && product.bundleItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Inkluderet i pakken</CardTitle>
              <CardDescription>
                {product.bundleItems.length}{' '}
                {product.bundleItems.length === 1 ? 'produkt' : 'produkter'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {product.bundleItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div>
                      <p className="font-medium">
                        {item.includedProduct.title}
                      </p>
                      {item.includedProduct.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.includedProduct.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Purchase section */}
        <div className="mt-6">
          {alreadyOwned ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center font-medium text-green-600">
                  Du har allerede adgang til dette produkt.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <Link href="/dashboard">Gå til dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : user ? (
            <BuyButton productId={product.id} productType={product.type} />
          ) : (
            <Button asChild className="w-full" size="lg">
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
