import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, BookOpen, Video, Users, Heart, Star, ChevronDown } from "lucide-react"

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

export default function Home() {
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
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                Giv dit barn den bedste start
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Din strukturerede vej til et trygt og kærligt forældreskab
                — med viden der virker og værktøjer du kan bruge i dag.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl px-8 text-base">
                  <Link href="/signup">Prøv FamilyMind gratis</Link>
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
      <section className="border-b border-border bg-white py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 text-center sm:px-8">
          <div className="flex gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>
          <p className="text-sm italic text-muted-foreground">
            &ldquo;FamilyMind har givet os en helt ny måde at forstå vores børn på.
            Vi føler os tryggere som forældre.&rdquo;
          </p>
          <p className="text-xs font-medium text-foreground">
            — Maria, mor til 2
          </p>
        </div>
      </section>

      {/* ─── Hvordan det virker ────────────────────────────────── */}
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
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-sand">
                <BookOpen className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 font-serif text-lg">1. Start dit forløb</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Svar på et par spørgsmål og få et forløb der passer
                præcis til din familie og dit barns alder.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-sand">
                <Video className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 font-serif text-lg">2. Lær i dit tempo</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Korte videoer, artikler og øvelser — én dag ad gangen.
                Brug 10-15 minutter når det passer dig.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-sand">
                <Heart className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 font-serif text-lg">3. Mærk forskellen</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Se positive forandringer i din hverdag. Bliv en tryggere
                forælder med værktøjer der virker.
              </p>
            </div>
          </div>
        </div>
      </section>

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
            {/* Forløb */}
            <div className="card-hover rounded-2xl border border-border bg-white p-6">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <h3 className="mb-1 font-serif text-lg">Strukturerede forløb</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dag-for-dag guides tilpasset dit barns alder.
                Følg en klar plan med video, øvelser og refleksion.
              </p>
            </div>

            {/* Videokurser */}
            <div className="card-hover rounded-2xl border border-border bg-white p-6">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-success-light">
                <Video className="size-5 text-success" />
              </div>
              <h3 className="mb-1 font-serif text-lg">Videokurser</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dybdegående kurser om specifikke emner — fra søvn
                til følelsesregulering og kommunikation.
              </p>
            </div>

            {/* Fællesskab */}
            <div className="card-hover rounded-2xl border border-border bg-white p-6">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-coral-light">
                <Users className="size-5 text-coral" />
              </div>
              <h3 className="mb-1 font-serif text-lg">Fællesskab</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Del erfaringer og få støtte fra andre forældre
                på samme rejse som dig.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">
              Det siger andre forældre
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border p-6">
              <div className="mb-3 flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;FamilyMind har ændret vores aftener fuldstændigt.
                Sengetiden er gået fra kamp til hygge.&rdquo;
              </p>
              <p className="text-sm font-medium">Maria</p>
              <p className="text-xs text-muted-foreground">Mor til 2 børn</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <div className="mb-3 flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;Endelig en platform der giver konkrete værktøjer
                og ikke bare teorier. Det virker i praksis.&rdquo;
              </p>
              <p className="text-sm font-medium">Thomas</p>
              <p className="text-xs text-muted-foreground">Far til 1 barn</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <div className="mb-3 flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;Jeg føler mig som en bedre mor. De små daglige
                øvelser har gjort en kæmpe forskel for os.&rdquo;
              </p>
              <p className="text-sm font-medium">Line</p>
              <p className="text-xs text-muted-foreground">Mor til 3 børn</p>
            </div>
          </div>
        </div>
      </section>

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
                  <span className="font-serif text-5xl">149 kr</span>
                  <span className="text-muted-foreground"> /måned</span>
                </div>

                <ul className="mb-8 space-y-3">
                  {[
                    'Alle strukturerede forløb',
                    'Videokurser og artikler',
                    'Daglige øvelser og refleksion',
                    'Check-ins og fremgangssporing',
                    'Personlige anbefalinger',
                    'Adgang til fællesskabet',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="w-full rounded-xl text-base">
                  <Link href="/signup">Start i dag</Link>
                </Button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Prøv gratis — betal først når du er klar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Om Mette ─────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Text first on mobile, second on desktop */}
            <div className="lg:order-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Bag FamilyMind
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl">Mette Hummel</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Mette er familieterapeut med mange års erfaring i at hjælpe
                familier med at skabe trygge og kærlige relationer.
                FamilyMind er bygget på hendes evidensbaserede metoder
                og gør professionel forældrevejledning tilgængelig for alle.
              </p>
              <Button asChild variant="ghost" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                <a href="https://mettehummel.dk" target="_blank" rel="noopener noreferrer">
                  Læs mere om Mette &rarr;
                </a>
              </Button>
            </div>

            {/* Portrait */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl lg:order-1">
              <Image
                src="/images/mette-hummel.jpeg"
                alt="Mette Hummel, familieterapeut"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">
              Ofte stillede spørgsmål
            </h2>
          </div>

          <div>
            <FAQItem
              question="Hvem er FamilyMind for?"
              answer="FamilyMind er for alle forældre der ønsker at styrke relationen til deres børn. Indholdet er tilpasset børn i alderen 0-6 år, men mange principper kan bruges til ældre børn."
            />
            <FAQItem
              question="Hvor lang tid tager det hver dag?"
              answer="Hvert dags-modul tager 10-15 minutter. Du kan se videoer og læse artikler når det passer dig — der er ingen faste tidspunkter."
            />
            <FAQItem
              question="Kan jeg afmelde når som helst?"
              answer="Ja, du kan afmelde dit abonnement når som helst. Der er ingen bindingsperiode. Du beholder adgang til udgangen af din betalingsperiode."
            />
            <FAQItem
              question="Er indholdet evidensbaseret?"
              answer="Ja, alt indhold er udviklet af Mette Hummel, autoriseret familieterapeut, og bygger på anerkendt forskning inden for børnepsykologi og forældreskab."
            />
            <FAQItem
              question="Kan vi bruge det som par?"
              answer="Absolut! Mange forældre bruger FamilyMind sammen. Det kan være en fantastisk måde at blive enige om fælles strategier og styrke jeres samarbejde."
            />
          </div>
        </div>
      </section>

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
            <Link href="/signup">Opret din konto gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
