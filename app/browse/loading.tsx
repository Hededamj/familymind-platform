import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto h-10 w-32" />
          <Skeleton className="mx-auto mt-2 h-5 w-64" />
        </div>

        {/* Filter pills */}
        <div className="mb-8 flex justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        {/* Product sections */}
        <div className="space-y-12">
          <section>
            <Skeleton className="mb-4 h-6 w-24" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          </section>

          <section>
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
