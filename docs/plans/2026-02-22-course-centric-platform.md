# Course-Centric Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Omstrukturere platformen så kurser (courses) er det centrale produkt med moduler, landing pages, og journey som valgfri guidet leveringsform — med varm, støttende engagement uden gamification.

**Architecture:** Product(type=COURSE) udvides med CourseModule som grupperingslag. Journey kobles til Product via FK og fungerer som "guidet forløb"-funktion for et kursus. Landing pages drives af JSON-konfiguration på Product. Browse-siden redesignes med featured bundles og kursuskategorier. Engagement forbedres med event-drevne milestones og indholds-drevne nudges (ingen streaks).

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Prisma 6, Supabase, Tailwind CSS 4, shadcn/ui

**Vigtige konventioner:**
- Dansk-first: altid æøå, aldrig ASCII-erstatninger
- Service layer pattern: ren business logic i `lib/services/`, server actions som tynde wrappers
- `$transaction` for alle multi-write operationer
- Mobile-first design for bruger-sider, desktop-first for admin

---

## Del 1: Datamodel (Tasks 1-3)

### Task 1: Schema — CourseModule, billeder, landing page, Journey→Product

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Tilføj CourseModule model**

Indsæt efter `CourseLesson` modellen (linje 227):

```prisma
model CourseModule {
  id        String @id @default(uuid()) @db.Uuid
  productId String @db.Uuid
  title     String
  description String?
  position  Int

  product Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  lessons CourseLesson[]

  @@index([productId])
}
```

**Step 2: Tilføj moduleId til CourseLesson**

Tilføj nullable FK til CourseLesson (nullable for migration af eksisterende data):

```prisma
model CourseLesson {
  id            String  @id @default(uuid()) @db.Uuid
  productId     String  @db.Uuid
  contentUnitId String  @db.Uuid
  moduleId      String? @db.Uuid    // <-- NYT, nullable
  position      Int

  product     Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  contentUnit ContentUnit   @relation(fields: [contentUnitId], references: [id], onDelete: Cascade)
  module      CourseModule? @relation(fields: [moduleId], references: [id], onDelete: SetNull)  // <-- NYT

  @@unique([productId, contentUnitId])
}
```

**Step 3: Tilføj billede- og landing page-felter til Product**

Tilføj efter `isActive` (linje 206):

```prisma
  coverImageUrl    String?
  thumbnailUrl     String?
  landingPage      Json?    // { hero, subtitle, benefits[], testimonials[], faq[], ctaText, ctaUrl }
```

Tilføj `modules` relation:

```prisma
  modules           CourseModule[]
```

**Step 4: Tilføj productId til Journey**

Tilføj efter `isActive` (linje 302):

```prisma
  productId    String?  @db.Uuid
  coverImageUrl String?
```

Tilføj relation:

```prisma
  product      Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
```

Tilføj `journeys` relation til Product:

```prisma
  journeys          Journey[]
```

**Step 5: Tilføj position til BundleItem**

```prisma
model BundleItem {
  id                String @id @default(uuid()) @db.Uuid
  bundleProductId   String @db.Uuid
  includedProductId String @db.Uuid
  position          Int    @default(0)   // <-- NYT
  ...
}
```

**Step 6: Kør migration**

Run: `npx prisma migrate dev --name course-modules-landing-pages`
Expected: Migration created and applied successfully.

**Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: schema — CourseModule, Product images/landingPage, Journey→Product FK"
```

---

### Task 2: Seed — Default moduler + FamilyMind organisation

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Tilføj default module for eksisterende kurser**

Tilføj efter seed-data, før `console.log('Seed data created successfully')`:

```typescript
// -- Default modules for existing courses --
const courses = await prisma.product.findMany({
  where: { type: 'COURSE' },
  include: { courseLessons: true, modules: true },
})

for (const course of courses) {
  if (course.modules.length === 0 && course.courseLessons.length > 0) {
    const defaultModule = await prisma.courseModule.create({
      data: {
        productId: course.id,
        title: 'Indhold',
        position: 1,
      },
    })
    // Assign all existing lessons to the default module
    await prisma.courseLesson.updateMany({
      where: { productId: course.id },
      data: { moduleId: defaultModule.id },
    })
    console.log(`  Created default module for course "${course.title}"`)
  }
}
```

**Step 2: Link test journey til kursus (hvis begge eksisterer)**

```typescript
// -- Link journey to course if both exist --
const testJourney = await prisma.journey.findUnique({ where: { slug: 'bedre-sovnrutiner' } })
if (testJourney && !testJourney.productId) {
  // Find a COURSE product with "søvn" in title, or skip
  const sleepCourse = await prisma.product.findFirst({
    where: { type: 'COURSE', title: { contains: 'søvn', mode: 'insensitive' } },
  })
  if (sleepCourse) {
    await prisma.journey.update({
      where: { id: testJourney.id },
      data: { productId: sleepCourse.id },
    })
    console.log(`  Linked journey "${testJourney.title}" to course "${sleepCourse.title}"`)
  }
}
```

**Step 3: Tilføj nye email templates for journey-engagement**

```typescript
// -- New email templates for journey engagement --
await prisma.emailTemplate.upsert({
  where: { templateKey: 'journey_welcome' },
  update: {},
  create: {
    templateKey: 'journey_welcome',
    subject: 'Dit forløb starter i morgen, {{userName}}',
    bodyHtml: '<h1>Hej {{userName}}</h1><p>Du har startet forløbet "{{journeyTitle}}". Din første dag er klar i morgen.</p><p>Forløbet tager ca. {{estimatedDays}} dage. Du kan gå i dit eget tempo.</p><p><a href="{{appUrl}}/dashboard">Gå til din side</a></p>',
    description: 'Sent when a user starts a guided journey',
    isActive: true,
  },
})

await prisma.emailTemplate.upsert({
  where: { templateKey: 'journey_day_complete' },
  update: {},
  create: {
    templateKey: 'journey_day_complete',
    subject: 'Godt klaret, {{userName}}!',
    bodyHtml: '<h1>Godt klaret, {{userName}}!</h1><p>Du har gennemført {{dayTitle}} i "{{journeyTitle}}".</p><p>{{nextDayTeaser}}</p><p><a href="{{appUrl}}/dashboard">Fortsæt i morgen</a></p>',
    description: 'Sent after completing a journey day',
    isActive: true,
  },
})

await prisma.emailTemplate.upsert({
  where: { templateKey: 'journey_nudge' },
  update: {},
  create: {
    templateKey: 'journey_nudge',
    subject: '{{nextDayTitle}} venter på dig',
    bodyHtml: '<h1>Hej {{userName}}</h1><p>Din næste dag i "{{journeyTitle}}" handler om {{nextDayTitle}}.</p><p>Det tager kun {{estimatedMinutes}} minutter.</p><p><a href="{{appUrl}}/dashboard">Fortsæt dit forløb</a></p>',
    description: 'Gentle nudge when user has not progressed in 1-2 days',
    isActive: true,
  },
})

await prisma.emailTemplate.upsert({
  where: { templateKey: 'journey_complete' },
  update: {},
  create: {
    templateKey: 'journey_complete',
    subject: 'Tillykke med dit gennemførte forløb, {{userName}}!',
    bodyHtml: '<h1>Tillykke, {{userName}}!</h1><p>Du har gennemført "{{journeyTitle}}".</p><p>Du kan altid gå tilbage og se indholdet igen.</p><p>{{recommendationText}}</p><p><a href="{{appUrl}}/dashboard">Tilbage til din side</a></p>',
    description: 'Sent when a user completes a journey',
    isActive: true,
  },
})
```

**Step 4: Kør seed**

Run: `npx prisma db seed`
Expected: Seed data created successfully.

**Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed — default modules, journey email templates"
```

---

### Task 3: Services — Module CRUD + Product landing page + Journey→Product

**Files:**
- Modify: `lib/services/product.service.ts`
- Modify: `lib/services/journey.service.ts`

**Step 1: Tilføj module CRUD til product.service.ts**

Tilføj efter `removeProductFromBundle`:

```typescript
// Course module management
export async function createModule(productId: string, data: { title: string; description?: string }) {
  const maxPos = await prisma.courseModule.aggregate({
    where: { productId },
    _max: { position: true },
  })
  return prisma.courseModule.create({
    data: {
      productId,
      title: data.title,
      description: data.description,
      position: (maxPos._max.position ?? 0) + 1,
    },
  })
}

export async function updateModule(id: string, data: { title?: string; description?: string }) {
  return prisma.courseModule.update({ where: { id }, data })
}

export async function deleteModule(id: string) {
  return prisma.$transaction(async (tx) => {
    // Unassign lessons from this module before deleting
    await tx.courseLesson.updateMany({
      where: { moduleId: id },
      data: { moduleId: null },
    })
    return tx.courseModule.delete({ where: { id } })
  })
}

export async function reorderModules(productId: string, moduleIds: string[]) {
  const updates = moduleIds.map((id, index) =>
    prisma.courseModule.update({ where: { id }, data: { position: index + 1 } })
  )
  return prisma.$transaction(updates)
}

export async function assignLessonToModule(lessonId: string, moduleId: string | null) {
  return prisma.courseLesson.update({
    where: { id: lessonId },
    data: { moduleId },
  })
}
```

**Step 2: Opdater listProducts og getProduct til at inkludere modules**

Tilføj `modules` til alle `include`-blokke i `listProducts`, `getProduct`, `getProductById`:

```typescript
include: {
  modules: { orderBy: { position: 'asc' } },
  courseLessons: {
    include: { contentUnit: true, module: true },
    orderBy: { position: 'asc' },
  },
  bundleItems: {
    include: { includedProduct: true },
    orderBy: { position: 'asc' },
  },
  journeys: { where: { isActive: true }, select: { id: true, slug: true, title: true } },
}
```

**Step 3: Tilføj landing page update funktion**

```typescript
export async function updateProductLandingPage(id: string, landingPage: Record<string, unknown>) {
  return prisma.product.update({
    where: { id },
    data: { landingPage },
  })
}

export async function updateProductImages(id: string, data: { coverImageUrl?: string; thumbnailUrl?: string }) {
  return prisma.product.update({
    where: { id },
    data,
  })
}
```

**Step 4: Opdater Journey service — tilføj productId support**

I `journey.service.ts`, opdater `createJourney`:

```typescript
export async function createJourney(data: {
  title: string
  description?: string
  slug: string
  targetAgeMin?: number
  targetAgeMax?: number
  estimatedDays?: number
  productId?: string        // <-- NYT
  coverImageUrl?: string    // <-- NYT
}) {
  return prisma.journey.create({ data })
}
```

Opdater `updateJourney`:

```typescript
export async function updateJourney(id: string, data: Partial<{
  title: string
  description: string | null
  slug: string
  targetAgeMin: number | null
  targetAgeMax: number | null
  estimatedDays: number | null
  isActive: boolean
  productId: string | null    // <-- NYT
  coverImageUrl: string | null // <-- NYT
}>) {
  return prisma.journey.update({ where: { id }, data })
}
```

Opdater `listJourneys` include:

```typescript
include: {
  phases: {
    include: { days: true },
    orderBy: { position: 'asc' },
  },
  product: { select: { id: true, title: true, slug: true, type: true } },
},
```

Opdater `getJourney` og `getJourneyById` include — tilføj:

```typescript
product: {
  select: { id: true, title: true, slug: true, type: true, thumbnailUrl: true },
},
```

**Step 5: Verificer build**

Run: `npx next build`
Expected: Compiled successfully.

**Step 6: Commit**

```bash
git add lib/services/product.service.ts lib/services/journey.service.ts
git commit -m "feat: services — module CRUD, landing page, journey→product linking"
```

---

## Del 2: Admin UI (Tasks 4-6)

### Task 4: Admin — Module management i kursus-editor

**Files:**
- Modify: `app/admin/products/_components/product-form.tsx`
- Modify: `app/admin/products/actions.ts`

**Step 1: Tilføj server actions for modules**

I `app/admin/products/actions.ts`, tilføj:

```typescript
'use server'
import { requireAdmin } from '@/lib/auth'
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  assignLessonToModule,
} from '@/lib/services/product.service'
import { revalidatePath } from 'next/cache'

export async function createModuleAction(productId: string, data: { title: string; description?: string }) {
  await requireAdmin()
  const result = await createModule(productId, data)
  revalidatePath(`/admin/products/${productId}/edit`)
  return result
}

export async function updateModuleAction(id: string, data: { title?: string; description?: string }) {
  await requireAdmin()
  const result = await updateModule(id, data)
  revalidatePath('/admin/products')
  return result
}

export async function deleteModuleAction(id: string) {
  await requireAdmin()
  await deleteModule(id)
  revalidatePath('/admin/products')
}

export async function reorderModulesAction(productId: string, moduleIds: string[]) {
  await requireAdmin()
  await reorderModules(productId, moduleIds)
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function assignLessonToModuleAction(lessonId: string, moduleId: string | null) {
  await requireAdmin()
  await assignLessonToModule(lessonId, moduleId)
  revalidatePath('/admin/products')
}
```

**Step 2: Udvid ProductForm med modul-sektion**

I `product-form.tsx`, tilføj modul-management efter lektions-sektionen for COURSE type:

For **COURSE type i edit mode**, vis:
1. En sektion "Moduler" med liste af moduler (titel, op/ned/slet)
2. "Tilføj modul" knap der åbner en dialog med titel-input
3. Under hvert modul vises de tilknyttede lektioner
4. Lektioner kan drag/moves til et andet modul
5. "Ikke-tildelte lektioner" sektion for lektioner uden moduleId

Implementér dette som en `ModuleManager` komponent der modtager `modules`, `lessons`, og action-funktioner som props. Hver modul viser:
- Titel (klikbar for edit)
- Op/ned pile for reorder
- Slet-knap (lektioner flyttes til "ikke-tildelt")
- Liste af lektioner i modulet

Lektioner har en dropdown "Flyt til modul" der kalder `assignLessonToModuleAction`.

**Step 3: Verificer build**

Run: `npx next build`
Expected: Compiled successfully.

**Step 4: Commit**

```bash
git add app/admin/products/
git commit -m "feat: admin — module management in course editor"
```

---

### Task 5: Admin — Billede-felter og landing page editor

**Files:**
- Modify: `app/admin/products/_components/product-form.tsx`
- Modify: `app/admin/products/actions.ts`

**Step 1: Tilføj billede-URL felter til ProductForm**

I grundoplysninger-sektionen, tilføj efter beskrivelse:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="coverImageUrl">Coverbillede URL</Label>
    <Input
      id="coverImageUrl"
      value={formData.coverImageUrl}
      onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
      placeholder="https://..."
    />
    <p className="text-xs text-muted-foreground">
      Bruges på landing page og browse-side
    </p>
  </div>
  <div className="space-y-2">
    <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
    <Input
      id="thumbnailUrl"
      value={formData.thumbnailUrl}
      onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
      placeholder="https://..."
    />
    <p className="text-xs text-muted-foreground">
      Lille billede til kort og lister
    </p>
  </div>
</div>
```

Opdater `ProductFormData` type og submit-handler til at inkludere de nye felter.

**Step 2: Tilføj Landing Page editor**

For COURSE og BUNDLE typer i edit mode, tilføj en ny Card-sektion "Landing page":

```tsx
{(formData.type === 'COURSE' || formData.type === 'BUNDLE') && mode === 'edit' && initialData && (
  <Card>
    <CardHeader>
      <CardTitle>Landing page</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Undertitel</Label>
        <Input
          value={landingPage.subtitle || ''}
          onChange={(e) => setLandingPage(prev => ({ ...prev, subtitle: e.target.value }))}
          placeholder="Kort undertitel til hero-sektionen"
        />
      </div>

      <div className="space-y-2">
        <Label>Fordele (én per linje)</Label>
        <Textarea
          value={(landingPage.benefits || []).join('\n')}
          onChange={(e) => setLandingPage(prev => ({
            ...prev,
            benefits: e.target.value.split('\n').filter(Boolean)
          }))}
          rows={4}
          placeholder="Forstå hvad der driver dit barns angst&#10;Lær konkrete værktøjer&#10;Skab ro i hverdagen"
        />
      </div>

      <div className="space-y-2">
        <Label>CTA knaptekst</Label>
        <Input
          value={landingPage.ctaText || ''}
          onChange={(e) => setLandingPage(prev => ({ ...prev, ctaText: e.target.value }))}
          placeholder="Start nu"
        />
      </div>

      <div className="space-y-2">
        <Label>CTA link</Label>
        <Input
          value={landingPage.ctaUrl || ''}
          onChange={(e) => setLandingPage(prev => ({ ...prev, ctaUrl: e.target.value }))}
          placeholder="/subscribe eller /products/bundle-slug"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleSaveLandingPage()}
      >
        Gem landing page
      </Button>
    </CardContent>
  </Card>
)}
```

`landingPage` state initialiseres fra `initialData?.landingPage` (parsed JSON).
`handleSaveLandingPage` kalder en ny `updateLandingPageAction`.

**Step 3: Server actions for billeder og landing page**

I `actions.ts`:

```typescript
export async function updateProductImagesAction(id: string, data: { coverImageUrl?: string; thumbnailUrl?: string }) {
  await requireAdmin()
  await updateProductImages(id, data)
  revalidatePath('/admin/products')
}

export async function updateLandingPageAction(id: string, landingPage: Record<string, unknown>) {
  await requireAdmin()
  await updateProductLandingPage(id, landingPage)
  revalidatePath('/admin/products')
}
```

**Step 4: Verificer build + commit**

Run: `npx next build`

```bash
git add app/admin/products/
git commit -m "feat: admin — product images and landing page editor"
```

---

### Task 6: Admin — Journey→Product kobling i journey editor

**Files:**
- Modify: `app/admin/journeys/[id]/edit/page.tsx`
- Modify: `app/admin/journeys/_components/journey-editor.tsx`
- Modify: `app/admin/journeys/actions.ts`

**Step 1: Hent kurser til journey editor**

I edit page, hent alle COURSE-produkter og send som prop:

```typescript
const courses = await listProducts({ type: 'COURSE', isActive: true })
```

**Step 2: Tilføj "Tilknyttet kursus" dropdown i JourneyEditor**

I basisoplysninger-sektionen af journey-editoren:

```tsx
<div className="space-y-2">
  <Label>Tilknyttet kursus (valgfrit)</Label>
  <Select
    value={formData.productId || 'none'}
    onValueChange={(v) => setFormData(prev => ({ ...prev, productId: v === 'none' ? null : v }))}
  >
    <SelectTrigger><SelectValue placeholder="Intet kursus" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Intet kursus (selvstændigt forløb)</SelectItem>
      {courses.map(c => (
        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Når et kursus er tilknyttet, vises forløbet som "Guidet forløb" på kursussiden
  </p>
</div>
```

**Step 3: Opdater journey update action**

Tilføj `productId` til updateJourneyAction:

```typescript
export async function updateJourneyAction(id: string, data: {
  // ... eksisterende felter
  productId?: string | null
  coverImageUrl?: string | null
}) {
  await requireAdmin()
  await updateJourney(id, data)
  revalidatePath('/admin/journeys')
}
```

**Step 4: Verificer build + commit**

Run: `npx next build`

```bash
git add app/admin/journeys/
git commit -m "feat: admin — journey→product linking in editor"
```

---

## Del 3: Bruger-oplevelse (Tasks 7-10)

### Task 7: Kursus-detaljeside med moduler

**Files:**
- Modify: `app/products/[slug]/page.tsx`

**Step 1: Omstrukturér kursus-sektionen til modul-hierarki**

Erstat den flade lektionsliste med en modul-grupperet visning:

```tsx
{/* Course modules */}
{product.type === 'COURSE' && (
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

    {product.modules.length > 0 ? (
      product.modules.map((module, mi) => {
        const moduleLessons = product.courseLessons
          .filter(l => l.moduleId === module.id)
          .sort((a, b) => a.position - b.position)

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
                {moduleLessons.map((lesson, li) => (
                  // Lektion-row med status (completed/started/locked)
                  // Same pattern som nuværende, men med modul-context
                ))}
              </ul>
            </div>
          </div>
        )
      })
    ) : (
      // Fallback: flad liste (for kurser uden moduler)
      <div className="rounded-2xl border border-border bg-white">
        {/* Eksisterende flade lektionsliste */}
      </div>
    )}
  </div>
)}
```

**Step 2: Tilføj Journey-sektion**

Hvis kurset har et tilknyttet journey, vis det som en alternativ oplevelse:

```tsx
{product.journeys && product.journeys.length > 0 && (
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
```

**Step 3: Vis produktbillede**

Tilføj coverbillede i header-sektionen:

```tsx
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
```

**Step 4: Verificer build + commit**

```bash
git add app/products/
git commit -m "feat: product detail — module hierarchy, journey link, cover image"
```

---

### Task 8: Kursus landing page

**Files:**
- Create: `app/courses/[slug]/page.tsx`

Dette er marketing-landing page til META-annoncer. Adskilt fra `/products/[slug]` (som er salg/indhold).

**Step 1: Opret landing page**

```tsx
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
  const moduleCount = product.modules.length
  const lessonCount = product.courseLessons.length

  return (
    <div>
      {/* Hero */}
      <section className="bg-sand px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
            Kursus &middot; {moduleCount} moduler &middot; {lessonCount} lektioner
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
      {product.modules.length > 0 && (
        <section className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center font-serif text-2xl">
              Kursusindhold
            </h2>
            <div className="space-y-4">
              {product.modules.map((module, i) => {
                const moduleLessonCount = product.courseLessons.filter(l => l.moduleId === module.id).length
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
```

**Step 2: Verificer build + commit**

```bash
git add app/courses/
git commit -m "feat: course landing page — marketing page for META ads"
```

---

### Task 9: In-course navigation på content-siden

**Files:**
- Modify: `app/content/[slug]/page.tsx`

**Step 1: Tilføj kursus-kontekst via searchParams**

Content-siden modtager `?course=<slug>` searchParam når brugeren kommer fra et kursus:

```tsx
export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ course?: string }>
}) {
  const { slug } = await params
  const { course: courseSlug } = await searchParams
  // ...

  // Load course context if provided
  let courseContext: {
    product: { title: string; slug: string }
    prevLesson: { slug: string; title: string } | null
    nextLesson: { slug: string; title: string } | null
    currentPosition: number
    totalLessons: number
  } | null = null

  if (courseSlug && user) {
    const course = await getProduct(courseSlug)
    if (course && course.type === 'COURSE') {
      const lessons = course.courseLessons.sort((a, b) => a.position - b.position)
      const currentIndex = lessons.findIndex(l => l.contentUnit.slug === slug)
      if (currentIndex >= 0) {
        courseContext = {
          product: { title: course.title, slug: course.slug },
          prevLesson: currentIndex > 0
            ? { slug: lessons[currentIndex - 1].contentUnit.slug, title: lessons[currentIndex - 1].contentUnit.title }
            : null,
          nextLesson: currentIndex < lessons.length - 1
            ? { slug: lessons[currentIndex + 1].contentUnit.slug, title: lessons[currentIndex + 1].contentUnit.title }
            : null,
          currentPosition: currentIndex + 1,
          totalLessons: lessons.length,
        }
      }
    }
  }
```

**Step 2: Vis kursus-kontekst i UI**

Erstat den statiske "Tilbage til min side" med kontekst-bevidst navigation:

```tsx
{/* Course context bar */}
{courseContext ? (
  <div className="mb-6 rounded-xl border border-border bg-white p-4">
    <div className="mb-2 flex items-center justify-between">
      <Link
        href={`/products/${courseContext.product.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {courseContext.product.title}
      </Link>
      <span className="text-xs text-muted-foreground">
        Lektion {courseContext.currentPosition} af {courseContext.totalLessons}
      </span>
    </div>
    <Progress
      value={(courseContext.currentPosition / courseContext.totalLessons) * 100}
      className="h-1.5"
    />
  </div>
) : (
  <Link
    href={user ? '/dashboard' : '/browse'}
    className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="size-4" />
    {user ? 'Tilbage til min side' : 'Tilbage'}
  </Link>
)}
```

**Step 3: Tilføj næste/forrige lektion under indhold**

Efter "Mark as complete" knappen:

```tsx
{/* Next/previous navigation */}
{courseContext && (
  <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
    {courseContext.prevLesson ? (
      <Link
        href={`/content/${courseContext.prevLesson.slug}?course=${courseContext.product.slug}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <span className="line-clamp-1">{courseContext.prevLesson.title}</span>
      </Link>
    ) : <div />}

    {courseContext.nextLesson ? (
      <Link
        href={`/content/${courseContext.nextLesson.slug}?course=${courseContext.product.slug}`}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <span className="line-clamp-1">{courseContext.nextLesson.title}</span>
        <ArrowRight className="size-4" />
      </Link>
    ) : (
      <Link
        href={`/products/${courseContext.product.slug}`}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        Tilbage til kurset
        <ArrowRight className="size-4" />
      </Link>
    )}
  </div>
)}
```

**Step 4: Opdater links fra kursus-detaljeside**

I `app/products/[slug]/page.tsx`, opdater lektions-links til at inkludere course context:

```tsx
// Fra: href={`/content/${lesson.slug}`}
// Til:
href={`/content/${lesson.slug}?course=${product.slug}`}
```

**Step 5: Verificer build + commit**

```bash
git add app/content/ app/products/
git commit -m "feat: in-course navigation — context bar, next/prev, progress"
```

---

### Task 10: Browse-side redesign

**Files:**
- Modify: `app/browse/page.tsx`
- Modify: `app/browse/_components/product-card.tsx`
- Modify: `app/browse/_components/browse-filters.tsx`

**Step 1: Hent journeys og tags til browse-siden**

```typescript
import { listProducts } from '@/lib/services/product.service'
import { listJourneys } from '@/lib/services/journey.service'

const [products, journeys] = await Promise.all([
  listProducts({ isActive: true }),
  listJourneys({ isActive: true }),
])

const bundles = products.filter(p => p.type === 'BUNDLE')
const courses = products.filter(p => p.type === 'COURSE')
const singles = products.filter(p => p.type === 'SINGLE')
// Journeys that are NOT linked to a course (standalone)
const standaloneJourneys = journeys.filter(j => !j.productId)
```

**Step 2: Redesign browse-layout**

```tsx
<div className="px-4 py-12 sm:px-8">
  <div className="mx-auto w-full max-w-6xl">
    <div className="mb-10 text-center">
      <h1 className="font-serif text-3xl sm:text-4xl">Opdag</h1>
      <p className="mt-2 text-muted-foreground">
        Kurser, pakker og forløb til din familie
      </p>
    </div>

    {/* Featured bundles */}
    {bundles.length > 0 && (
      <section className="mb-12">
        <h2 className="mb-4 font-serif text-xl">Pakker</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {bundles.map(bundle => (
            <BundleCard key={bundle.id} product={bundle} />
          ))}
        </div>
      </section>
    )}

    {/* Courses */}
    {courses.length > 0 && (
      <section className="mb-12">
        <h2 className="mb-4 font-serif text-xl">Kurser</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <ProductCard key={course.id} product={course} />
          ))}
        </div>
      </section>
    )}

    {/* Standalone journeys */}
    {standaloneJourneys.length > 0 && (
      <section className="mb-12">
        <h2 className="mb-4 font-serif text-xl">Guidede forløb</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {standaloneJourneys.map(journey => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </div>
      </section>
    )}

    {/* Singles */}
    {singles.length > 0 && (
      <section className="mb-12">
        <h2 className="mb-4 font-serif text-xl">Enkeltstående indhold</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {singles.map(single => (
            <ProductCard key={single.id} product={single} />
          ))}
        </div>
      </section>
    )}
  </div>
</div>
```

**Step 3: Opdater ProductCard med billede**

I `product-card.tsx`, tilføj thumbnail:

```tsx
{product.thumbnailUrl ? (
  <Image
    src={product.thumbnailUrl}
    alt={product.title}
    width={400}
    height={225}
    className="aspect-video w-full object-cover"
  />
) : (
  <div className="flex aspect-video items-center justify-center bg-sand">
    {/* Eksisterende ikon-fallback */}
  </div>
)}
```

**Step 4: Opret BundleCard og JourneyCard**

`BundleCard` — større kort med coverbillede, inkluderede kurser-liste, pris.
`JourneyCard` — kort med estimeret dage, aldersgruppe, beskrivelse.

**Step 5: Verificer build + commit**

```bash
git add app/browse/
git commit -m "feat: browse redesign — featured bundles, course sections, journey discovery"
```

---

## Del 4: Engagement (Tasks 11-13)

### Task 11: Event-drevet milestones

**Files:**
- Modify: `lib/services/journey.service.ts` (completeDay)
- Modify: `lib/services/progress.service.ts` (markContentCompleted)
- Modify: `lib/services/engagement.service.ts`

**Step 1: Trigger milestones ved dag-completion**

I `journey.service.ts`, opdater `completeDay` — tilføj efter transaktionen:

```typescript
export async function completeDay(userJourneyId: string, dayId: string, checkInOptionId: string, reflection?: string) {
  const result = await prisma.$transaction(async (tx) => {
    // ... eksisterende logik uændret
  })

  // Fire engagement events AFTER transaction succeeds (ikke blokerende)
  const uj = await prisma.userJourney.findUnique({
    where: { id: userJourneyId },
    select: { userId: true, journeyId: true, status: true, journey: { select: { title: true } } },
  })

  if (uj) {
    // Check milestones (non-blocking)
    checkAndNotifyMilestones(uj.userId).catch(console.error)

    // Send day completion notification
    if (result.status !== 'COMPLETED') {
      // Journey continues — send warm "godt klaret" notification
      sendDayCompleteNotification(uj.userId, uj.journey.title, dayId, result.currentDayId).catch(console.error)
    } else {
      // Journey completed — send celebration
      sendJourneyCompleteNotification(uj.userId, uj.journey.title, uj.journeyId).catch(console.error)
    }
  }

  return result
}
```

**Step 2: Tilføj notification-hjælpefunktioner til engagement.service.ts**

```typescript
export async function sendDayCompleteNotification(
  userId: string,
  journeyTitle: string,
  completedDayId: string,
  nextDayId: string | null
) {
  // In-app notification
  await createInAppNotification(
    userId,
    'SYSTEM',
    'Godt klaret!',
    nextDayId
      ? `Du har gennemført en dag i "${journeyTitle}". Næste dag venter.`
      : `Du har gennemført "${journeyTitle}"!`,
    '/dashboard'
  )

  // Get next day info for email teaser
  let nextDayTeaser = ''
  if (nextDayId) {
    const nextDay = await prisma.journeyDay.findUnique({
      where: { id: nextDayId },
      select: { title: true, position: true },
    })
    nextDayTeaser = nextDay?.title
      ? `I morgen: ${nextDay.title}`
      : 'Din næste dag er klar i morgen.'
  }

  // Get completed day title
  const completedDay = await prisma.journeyDay.findUnique({
    where: { id: completedDayId },
    select: { title: true },
  })

  await sendTemplatedEmail(userId, 'journey_day_complete', {
    journeyTitle,
    dayTitle: completedDay?.title || 'dagens indhold',
    nextDayTeaser,
  })
}

export async function sendJourneyCompleteNotification(
  userId: string,
  journeyTitle: string,
  journeyId: string
) {
  await createInAppNotification(
    userId,
    'MILESTONE',
    `Tillykke! Du har gennemført "${journeyTitle}"`,
    'Du kan altid gå tilbage og se indholdet igen.',
    '/dashboard'
  )

  // Get recommendation for "what's next"
  const recommendations = await prisma.recommendationRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
    take: 1,
  })
  const recommendationText = recommendations.length > 0
    ? 'Vi har fundet et nyt forløb der passer til dig.'
    : 'Udforsk vores andre kurser og forløb.'

  await sendTemplatedEmail(userId, 'journey_complete', {
    journeyTitle,
    recommendationText,
  })
}
```

**Step 3: Trigger milestones ved content completion**

I `progress.service.ts`, opdater `markContentCompleted`:

```typescript
import { checkAndNotifyMilestones } from './engagement.service'

export async function markContentCompleted(userId: string, contentUnitId: string) {
  const result = await prisma.userContentProgress.upsert({
    where: { userId_contentUnitId: { userId, contentUnitId } },
    update: { completedAt: new Date() },
    create: { userId, contentUnitId, completedAt: new Date() },
  })

  // Check milestones after content completion (non-blocking)
  checkAndNotifyMilestones(userId).catch(console.error)

  return result
}
```

**Step 4: Verificer build + commit**

```bash
git add lib/services/
git commit -m "feat: event-driven milestones on day and content completion"
```

---

### Task 12: Journey-aware inaktivitets-nudge

**Files:**
- Modify: `app/api/cron/engagement/route.ts`
- Modify: `lib/services/engagement.service.ts`

**Step 1: Tilføj journey nudge-type til engagement.service.ts**

```typescript
/**
 * Send journey-specific nudge to users who haven't progressed in 1+ days.
 * Called by the engagement cron.
 * Tone: warm, content-focused ("din næste dag handler om X"), NOT pushy.
 */
export async function sendJourneyNudges(): Promise<{ sent: number; skipped: number }> {
  const BATCH_SIZE = 20
  let sent = 0
  let skipped = 0

  // Find users with active journeys who haven't had a check-in in 1-2 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 1) // 1 day ago

  const staleJourneys = await prisma.userJourney.findMany({
    where: {
      status: 'ACTIVE',
      currentDayId: { not: null },
    },
    include: {
      user: { select: { id: true, email: true } },
      currentDay: { select: { id: true, title: true, position: true } },
      journey: { select: { title: true } },
      checkIns: {
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: { completedAt: true },
      },
    },
    take: BATCH_SIZE * 5, // Fetch extra, filter in-memory
  })

  for (const uj of staleJourneys) {
    const lastCheckIn = uj.checkIns[0]?.completedAt
    const lastActivity = lastCheckIn || uj.startedAt

    // Only nudge if 1-3 days inactive (re-engagement handles longer)
    const daysSinceActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceActivity < 1 || daysSinceActivity > 3) {
      skipped++
      continue
    }

    // Deduplicate: check if we already sent a journey_nudge in the last 24 hours
    const recentNudge = await prisma.userNotificationLog.findFirst({
      where: {
        userId: uj.user.id,
        type: 'journey_nudge',
        sentAt: { gte: cutoffDate },
      },
    })
    if (recentNudge) {
      skipped++
      continue
    }

    // Send warm nudge — focus on content, not on the user's absence
    const nextDayTitle = uj.currentDay?.title || 'din næste dag'

    await sendTemplatedEmail(uj.user.id, 'journey_nudge', {
      journeyTitle: uj.journey.title,
      nextDayTitle,
      estimatedMinutes: '10-15',
    })

    await createInAppNotification(
      uj.user.id,
      'SYSTEM',
      `${nextDayTitle} venter på dig`,
      `Dit forløb "${uj.journey.title}" — næste dag er klar.`,
      '/dashboard'
    )

    await prisma.userNotificationLog.create({
      data: { userId: uj.user.id, type: 'journey_nudge', key: uj.journeyId },
    })

    sent++
    if (sent >= BATCH_SIZE) break
  }

  return { sent, skipped }
}
```

**Step 2: Kald fra engagement cron**

I `app/api/cron/engagement/route.ts`, tilføj et kald til `sendJourneyNudges()` ved siden af de eksisterende notification-typer:

```typescript
// After existing notification processing:
const nudgeResults = await sendJourneyNudges()
console.log(`[engagement] Journey nudges: ${nudgeResults.sent} sent, ${nudgeResults.skipped} skipped`)
```

**Step 3: Verificer build + commit**

```bash
git add lib/services/engagement.service.ts app/api/cron/engagement/
git commit -m "feat: journey-aware nudges — warm, content-focused reminders"
```

---

### Task 13: Fix manglende cron schedules + engagement timing

**Files:**
- Modify: `vercel.json`

**Step 1: Tilføj manglende cron-jobs**

Åbn `vercel.json` og tilføj de manglende schedules:

```json
{
  "crons": [
    { "path": "/api/cron/engagement", "schedule": "0 7 * * *" },
    { "path": "/api/cron/reengagement", "schedule": "0 8 * * *" },
    { "path": "/api/cron/monthly-progress", "schedule": "0 9 1 * *" },
    { "path": "/api/cron/community-digest", "schedule": "0 10 * * 1" },
    { "path": "/api/cron/discussion-prompts", "schedule": "0 7 * * *" }
  ]
}
```

Bemærk: monthly-progress kører den 1. i måneden. community-digest kører mandag. discussion-prompts kører dagligt.

**Step 2: Tilføj dedup til monthly-progress cron**

I `app/api/cron/monthly-progress/route.ts`, tilføj deduplication:

```typescript
// Before sending, check if already sent this month
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const alreadySent = await prisma.userNotificationLog.findFirst({
  where: {
    userId: user.id,
    type: 'monthly_progress',
    sentAt: { gte: startOfMonth },
  },
})
if (alreadySent) continue

// After sending, log it
await prisma.userNotificationLog.create({
  data: { userId: user.id, type: 'monthly_progress', key: monthStr },
})
```

**Step 3: Verificer build + commit**

```bash
git add vercel.json app/api/cron/
git commit -m "fix: register all cron schedules + dedup monthly progress"
```

---

## Verifikation

After all tasks are complete:

1. **Build**: `npx next build` — ingen compile errors
2. **Migration**: `npx prisma migrate dev` — alle migrations kører clean
3. **Seed**: `npx prisma db seed` — default moduler oprettes for eksisterende kurser
4. **Admin → Produkter → Kursus**: Moduler kan oprettes, lektioner tildeles moduler
5. **Admin → Produkter → Kursus**: Billede-URLs og landing page kan konfigureres
6. **Admin → Journeys → Edit**: Kursus kan tilknyttes via dropdown
7. **/products/[slug]**: Viser moduler i hierarki, viser "Guidet forløb" link
8. **/courses/[slug]**: Marketing landing page viser hero, benefits, moduler, FAQ, CTA
9. **/content/[slug]?course=X**: Viser kursus-kontekst med næste/forrige navigation
10. **/browse**: Viser bundles øverst, derefter kurser, derefter journeys
11. **Journey dag-completion**: Sender in-app notification + email, tjekker milestones
12. **Content completion**: Tjekker milestones
13. **Vercel cron**: Alle 5 jobs er registreret

---

## Hvad denne plan IKKE inkluderer (bevidst)

- **Stripe rabatkode-fix** — separat task, kræver Stripe Coupon API
- **N+1 optimering** — performance-fix efter funktionalitet virker
- **Bundle landing page** (`/bundles/[slug]`) — kan genbruge `/courses/[slug]` mønstret, lavere prioritet
- **Testimonials og FAQ i admin** — JSON-felter virker, men admin UI for at redigere arrays kræver mere avanceret editor (deferred)
- **Billedupload** — plan bruger URL-felter, ikke upload-widget. Upload kan tilføjes senere via Bunny.net Storage.
- **Tenant-abstraktion** — separat plan eksisterer allerede
