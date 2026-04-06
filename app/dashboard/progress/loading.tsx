import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Skeleton className="mb-6 h-4 w-16" />

        <Skeleton className="mb-1 h-8 w-40" />
        <Skeleton className="mb-8 h-4 w-64" />

        {/* Stats grid: 6 cards */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Milestones */}
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
