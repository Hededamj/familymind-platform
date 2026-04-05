import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Check, BookOpen, Video, Users, Heart,
  UserPlus, Compass, TrendingUp, Star,
  ChevronDown, type LucideIcon,
} from "lucide-react"
import { getTenantConfig } from "@/lib/services/tenant.service"

/* ─── Icon mapping helper ────────────────────────────────────────── */
const iconMap: Record<string, LucideIcon> = {
  BookOpen, Video, Users, Heart, UserPlus, Compass, TrendingUp, Star,
}

function getIcon(name: string): LucideIcon {
  return iconMap[name] || BookOpen
}

/* ─── FAQ accordion item ─────────────────────────────────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-border py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between font-sans text-base font-medium text-foreground">
        {question}
        <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {answer}
      </p>
    </details>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default async function Home() {
  const tenant = await getTenantConfig()

  const benefits = tenant.landingBenefits ?? []

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Text */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Evidensbaseret forældreguide
              </p>
              <h1 className="font-serif text-2xl leading-tight sm:text-4xl lg:text-5xl">
                {tenant.heroHeading || 'Giv dit barn den bedste start'}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {tenant.heroSubheading || 'Din strukturerede vej til et trygt og kærligt forældreskab — med viden der virker og værktøjer du kan bruge i dag.'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl px-8 text-base">
                  <Link href={tenant.heroCtaUrl || '/signup'}>
                    {tenant.heroCtaText || 'Prøv gratis'}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-base text-muted-foreground">
                  <Link href="#hvordan">Se hvordan det virker</Link>
                </Button>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/hero-family.jpg"
                alt="Familie hygger sig sammen"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─────────────────────────────────────── */}
      {tenant.landingTestimonials && tenant.landingTestimonials.length > 0 && (
        <section className="border-b border-border bg-white py-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 text-center sm:px-8">
            <div className="flex gap-1 text-amber-400">
              {[...Array(tenant.landingTestimonials[0].stars)].map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <p className="text-sm italic text-muted-foreground">
              &ldquo;{tenant.landingTestimonials[0].quote}&rdquo;
            </p>
            <p className="text-xs font-medium text-foreground">
              — {tenant.landingTestimonials[0].name}
            </p>
          </div>
        </section>
      )}

      {/* ─── Hvordan det virker ────────────────────────────────── */}
      {tenant.landingSteps && tenant.landingSteps.length > 0 && (
        <section id="hvordan" className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                Tre enkle trin
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl">
                Sådan kommer du i gang
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {tenant.landingSteps.map((step, idx) => {
                const Icon = getIcon(step.icon)
                return (
                  <div key={idx} className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-sand">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-serif text-lg">{`${idx + 1}. ${step.title}`}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Billede-break ───────────────────────────────────── */}
      <section className="relative h-64 sm:h-80 lg:h-96">
        <Image
          src="/images/mom-daughter-laughing.jpg"
          alt="Mor og datter griner sammen"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
      </section>

      {/* ─── Indhold preview ──────────────────────────────────── */}
      {tenant.landingFeatures && tenant.landingFeatures.length > 0 && (
        <section className="bg-sand">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl">
                Alt hvad du har brug for
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ét sted med al den viden og støtte din familie fortjener
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tenant.landingFeatures.map((feature, idx) => {
                const Icon = getIcon(feature.icon)
                return (
                  <div key={idx} className="card-hover rounded-2xl border border-border bg-white p-6">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="mb-1 font-serif text-lg">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Testimonials ─────────────────────────────────────── */}
      {tenant.landingTestimonials && tenant.landingTestimonials.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl">
                Det siger andre forældre
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tenant.landingTestimonials.map((testimonial, idx) => (
                <div key={idx} className="rounded-2xl border border-border p-6">
                  <div className="mb-3 flex gap-1 text-amber-400">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Pris ─────────────────────────────────────────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/family-kitchen.jpg"
                alt="Familie hygger i køkkenet"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Pricing card */}
            <div>
              <h2 className="mb-2 font-serif text-3xl sm:text-4xl">
                Én pris. Alt inkluderet.
              </h2>
              <p className="mb-8 text-muted-foreground">
                Ingen bindingsperiode — afmeld når som helst
              </p>

              <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
                <div className="mb-6 text-center">
                  <span className="font-serif text-5xl">
                    {tenant.subscriptionPriceDisplay || '149 kr'}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}{tenant.subscriptionPeriodDisplay || '/måned'}
                  </span>
                </div>

                <ul className="mb-8 space-y-3">
                  {benefits.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="w-full rounded-xl text-base">
                  <Link href={tenant.heroCtaUrl || '/signup'}>Start i dag</Link>
                </Button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Prøv gratis — betal først når du er klar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Om ──────────────────────────────────────────────── */}
      {tenant.aboutName && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Text first on mobile, second on desktop */}
              <div className="lg:order-2">
                {tenant.aboutHeading && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {tenant.aboutHeading}
                  </p>
                )}
                <h2 className="font-serif text-3xl sm:text-4xl">{tenant.aboutName}</h2>
                {tenant.aboutBio && (
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {tenant.aboutBio}
                  </p>
                )}
                {tenant.aboutUrl && (
                  <Button asChild variant="ghost" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                    <a href={tenant.aboutUrl} target="_blank" rel="noopener noreferrer">
                      Læs mere om {tenant.aboutName} &rarr;
                    </a>
                  </Button>
                )}
              </div>

              {/* Portrait */}
              {tenant.aboutImageUrl && (
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl lg:order-1">
                  <Image
                    src={tenant.aboutImageUrl}
                    alt={`${tenant.aboutName}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      {tenant.landingFaq && tenant.landingFaq.length > 0 && (
        <section className="bg-sand">
          <div className="mx-auto max-w-2xl px-4 py-20 sm:px-8">
            <div className="mb-10 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl">
                Ofte stillede spørgsmål
              </h2>
            </div>

            <div>
              {tenant.landingFaq.map((faq, idx) => (
                <FAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Final CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/family-dancing.jpg"
          alt="Familie danser i køkkenet"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#1A1A1A]/70" />
        <div className="relative mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
          <h2 className="font-serif text-3xl text-white sm:text-4xl">
            Klar til at komme i gang?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/80">
            Begynd din rejse mod et tryggere og mere kærligt forældreskab.
            Det tager kun 2 minutter at oprette din konto.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-xl bg-white px-8 text-base text-[#1A1A1A] hover:bg-white/90"
          >
            <Link href={tenant.heroCtaUrl || '/signup'}>
              {tenant.heroCtaText || 'Opret din konto gratis'}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
