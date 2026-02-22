import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Check, BookOpen, Video, Users, Heart, Star, ChevronDown,
  UserPlus, Compass, TrendingUp, type LucideIcon,
} from "lucide-react"
import { getTenantConfig } from "@/lib/services/tenant.service"

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Video,
  Users,
  Heart,
  UserPlus,
  Compass,
  TrendingUp,
  Check,
  Star,
}

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

export default async function Home() {
  const tenant = await getTenantConfig()

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {tenant.tagline && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {tenant.tagline}
              </p>
            )}
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">
              {tenant.heroHeading || `Velkommen til ${tenant.brandName}`}
            </h1>
            {tenant.heroSubheading && (
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {tenant.heroSubheading}
              </p>
            )}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-xl px-8 text-base">
                <Link href={tenant.heroCtaUrl || "/signup"}>
                  {tenant.heroCtaText || `Prøv ${tenant.brandName} gratis`}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-base text-muted-foreground">
                <Link href="#hvordan">Se hvordan det virker</Link>
              </Button>
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
              {tenant.landingSteps.map((step, i) => {
                const Icon = iconMap[step.icon] || BookOpen
                return (
                  <div key={i} className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-sand">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-serif text-lg">
                      {i + 1}. {step.title}
                    </h3>
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
              {tenant.landingFeatures.map((feature, i) => {
                const Icon = iconMap[feature.icon] || BookOpen
                return (
                  <div key={i} className="card-hover rounded-2xl border border-border bg-white p-6">
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
              {tenant.landingTestimonials.map((t, i) => (
                <div key={i} className="rounded-2xl border border-border p-6">
                  <div className="mb-3 flex gap-1 text-amber-400">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="text-sm font-medium">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Pris ─────────────────────────────────────────────── */}
      {tenant.subscriptionPriceDisplay && (
        <section className="bg-sand">
          <div className="mx-auto max-w-lg px-4 py-20 sm:px-8">
            <div className="mb-8 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl">
                Én pris. Alt inkluderet.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ingen bindingsperiode — afmeld når som helst
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
              <div className="mb-6 text-center">
                <span className="font-serif text-5xl">{tenant.subscriptionPriceDisplay}</span>
                {tenant.subscriptionPeriodDisplay && (
                  <span className="text-muted-foreground"> {tenant.subscriptionPeriodDisplay}</span>
                )}
              </div>

              {tenant.landingBenefits && tenant.landingBenefits.length > 0 && (
                <ul className="mb-8 space-y-3">
                  {tenant.landingBenefits.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button asChild size="lg" className="w-full rounded-xl text-base">
                <Link href="/signup">Start i dag</Link>
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Prøv gratis — betal først når du er klar
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── Om ─────────────────────────────────────────────── */}
      {tenant.aboutName && (
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-8">
            <div className="text-center">
              {tenant.aboutHeading && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {tenant.aboutHeading}
                </p>
              )}
              <h2 className="font-serif text-3xl sm:text-4xl">{tenant.aboutName}</h2>
              {tenant.aboutBio && (
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {tenant.aboutBio}
                </p>
              )}
              {tenant.aboutUrl && (
                <Button asChild variant="ghost" className="mt-4 text-primary">
                  <a href={tenant.aboutUrl} target="_blank" rel="noopener noreferrer">
                    Læs mere om {tenant.aboutName}
                  </a>
                </Button>
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
              {tenant.landingFaq.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Final CTA ────────────────────────────────────────── */}
      <section className="bg-[#1A1A1A]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-8">
          <h2 className="font-serif text-3xl text-white sm:text-4xl">
            Klar til at komme i gang?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/70">
            Begynd din rejse mod et tryggere og mere kærligt forældreskab.
            Det tager kun 2 minutter at oprette din konto.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-xl bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/signup">Opret din konto gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
