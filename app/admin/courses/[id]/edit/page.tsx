import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getCourseById } from '@/lib/services/course.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CourseDetailsTab } from './_components/course-details-tab'
import { CourseCurriculumTab } from './_components/course-curriculum-tab'
import { CoursePricingTab } from './_components/course-pricing-tab'
import { CourseStudentsTab } from './_components/course-students-tab'

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tilbage til kurser
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            {course.isActive ? (
              <Badge variant="default">Aktiv</Badge>
            ) : (
              <Badge variant="secondary">Inaktiv</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{course.slug}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/courses/${course.slug}`} target="_blank">
            <ExternalLink className="mr-2 size-4" />
            Forhåndsvis
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detaljer</TabsTrigger>
          <TabsTrigger value="curriculum">Indhold</TabsTrigger>
          <TabsTrigger value="pricing">Priser</TabsTrigger>
          <TabsTrigger value="students">Studerende</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <CourseDetailsTab
            course={{
              id: course.id,
              title: course.title,
              slug: course.slug,
              description: course.description,
              coverImageUrl: course.coverImageUrl,
              isActive: course.isActive,
            }}
          />
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6">
          <CourseCurriculumTab
            courseId={course.id}
            modules={course.modules.map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              position: m.position,
            }))}
            lessons={course.lessons.map((l) => ({
              id: l.id,
              moduleId: l.moduleId,
              position: l.position,
              isFreePreview: l.isFreePreview,
              contentUnit: {
                id: l.contentUnit.id,
                title: l.contentUnit.title,
                mediaType: l.contentUnit.mediaType,
              },
            }))}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <CoursePricingTab
            courseId={course.id}
            variants={course.priceVariants.map((v) => ({
              id: v.id,
              label: v.label,
              description: v.description,
              amountCents: v.amountCents,
              currency: v.currency,
              billingType: v.billingType,
              interval: v.interval,
              intervalCount: v.intervalCount,
              trialDays: v.trialDays,
              isHighlighted: v.isHighlighted,
              stripePriceId: v.stripePriceId,
            }))}
          />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <CourseStudentsTab courseId={course.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
