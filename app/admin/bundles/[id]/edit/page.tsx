import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getBundleById } from '@/lib/services/bundle.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BundleDetailsTab } from './_components/bundle-details-tab'
import { BundleContentsTab } from './_components/bundle-contents-tab'
import { BundlePricingTab } from './_components/bundle-pricing-tab'
import { BundleStudentsTab } from './_components/bundle-students-tab'

export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const bundle = await getBundleById(id)
  if (!bundle) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bundles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tilbage til bundler
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{bundle.title}</h1>
            {bundle.isActive ? (
              <Badge variant="default">Aktiv</Badge>
            ) : (
              <Badge variant="secondary">Inaktiv</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{bundle.slug}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/bundles/${bundle.slug}`} target="_blank">
            <ExternalLink className="mr-2 size-4" />
            Forhåndsvis
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detaljer</TabsTrigger>
          <TabsTrigger value="contents">Indhold</TabsTrigger>
          <TabsTrigger value="pricing">Priser</TabsTrigger>
          <TabsTrigger value="students">Studerende</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <BundleDetailsTab
            bundle={{
              id: bundle.id,
              title: bundle.title,
              slug: bundle.slug,
              description: bundle.description,
              coverImageUrl: bundle.coverImageUrl,
              isActive: bundle.isActive,
            }}
          />
        </TabsContent>

        <TabsContent value="contents" className="mt-6">
          <BundleContentsTab
            bundleId={bundle.id}
            courses={bundle.courses.map((bc) => ({
              courseId: bc.course.id,
              title: bc.course.title,
              slug: bc.course.slug,
              position: bc.position,
            }))}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <BundlePricingTab
            bundleId={bundle.id}
            variants={bundle.priceVariants.map((v) => ({
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
          <BundleStudentsTab bundleId={bundle.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
