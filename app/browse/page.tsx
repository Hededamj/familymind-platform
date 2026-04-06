import { Suspense } from 'react'
import { listProducts } from '@/lib/services/product.service'
import { listJourneys } from '@/lib/services/journey.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { ProductCard } from './_components/product-card'
import { BundleCard } from './_components/bundle-card'
import { JourneyCard } from './_components/journey-card'
import { BrowseFilters } from './_components/browse-filters'
import { BrowseSearch } from './_components/browse-search'
import { Compass, SearchX } from 'lucide-react'

export async function generateMetadata() {
  const tenant = await getTenantConfig()
  return {
    title: `Udforsk | ${tenant.brandName}`,
    description: 'Gennemse kurser, pakker og forløb',
  }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string }>
}) {
  const { type, search } = await searchParams

  const [products, journeys] = await Promise.all([
    listProducts({ isActive: true, search }),
    listJourneys({ isActive: true, search }),
  ])

  const bundles = products.filter(p => p.type === 'BUNDLE')
  const courses = products.filter(p => p.type === 'COURSE')
  const singles = products.filter(p => p.type === 'SINGLE')
  const standaloneJourneys = journeys.filter(j => !j.productId)

  // If filter is active, only show that section
  const showBundles = !type || type === 'BUNDLE'
  const showCourses = !type || type === 'COURSE'
  const showJourneys = !type || type === 'JOURNEY'
  const showSingles = !type || type === 'SINGLE'

  const isEmpty = (showBundles ? bundles.length : 0) +
    (showCourses ? courses.length : 0) +
    (showJourneys ? standaloneJourneys.length : 0) +
    (showSingles ? singles.length : 0) === 0

  return (
    <div className="px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl">Opdag</h1>
          <p className="mt-2 text-muted-foreground">
            Kurser, pakker og forløb til din familie
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <Suspense fallback={null}>
            <BrowseSearch />
          </Suspense>
        </div>

        <div className="mb-8 flex justify-center">
          <Suspense fallback={null}>
            <BrowseFilters />
          </Suspense>
        </div>

        {isEmpty ? (
          <div className="mx-auto max-w-sm rounded-2xl border border-border p-12 text-center">
            {search ? (
              <>
                <SearchX className="mx-auto mb-4 size-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Ingen resultater for &lsquo;{search}&rsquo;. Prøv et andet søgeord.
                </p>
              </>
            ) : (
              <>
                <Compass className="mx-auto mb-4 size-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">Ingen resultater fundet.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Bundles */}
            {showBundles && bundles.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-xl">Pakker</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {bundles.map(bundle => (
                    <BundleCard key={bundle.id} product={bundle} />
                  ))}
                </div>
              </section>
            )}

            {/* Courses */}
            {showCourses && courses.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-xl">Kurser</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map(course => (
                    <ProductCard key={course.id} product={course} />
                  ))}
                </div>
              </section>
            )}

            {/* Standalone journeys */}
            {showJourneys && standaloneJourneys.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-xl">Guidede forløb</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {standaloneJourneys.map(journey => (
                    <JourneyCard key={journey.id} journey={journey} />
                  ))}
                </div>
              </section>
            )}

            {/* Singles */}
            {showSingles && singles.length > 0 && (
              <section>
                <h2 className="mb-4 font-serif text-xl">Enkeltstående indhold</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {singles.map(single => (
                    <ProductCard key={single.id} product={single} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
