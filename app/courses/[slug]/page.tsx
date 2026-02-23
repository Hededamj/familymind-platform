import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProduct } from '@/lib/services/product.service'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

type LandingPageConfig = {
  subtitle?: string
  benefits?: string[]
  testimonials?: Array<{ name: string; text: string }>
  faq?: Array<{ question: string; answer: string }>
  ctaText?: string
  ctaUrl?: string
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

  const lp = (product.landingPage as LandingPageConfig) || {}
  const ctaUrl = lp.ctaUrl || `/products/${product.slug}`
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
