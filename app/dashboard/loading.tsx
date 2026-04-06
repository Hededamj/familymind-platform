import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="overflow-hidden px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Greeting */}
        <Skeleton className="mb-2 h-8 w-56" />
        <Skeleton className="mb-6 h-4 w-72" />

        {/* Community pills */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        <div className="mt-6 space-y-8">
          {/* Check-in section */}
          <section>
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-24 rounded-2xl" />
          </section>

          {/* Weekly focus */}
          <section>
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-40 rounded-2xl" />
          </section>

          {/* Courses grid */}
          <section>
            <Skeleton className="mb-2 h-5 w-28" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
