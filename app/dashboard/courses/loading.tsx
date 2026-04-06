import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Skeleton className="mb-8 h-8 w-40" />

        {/* Active journey */}
        <section className="mb-8">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-48 rounded-2xl" />
        </section>

        {/* Course grid */}
        <section className="mb-8">
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </section>
      </div>
    </div>
  )
}
