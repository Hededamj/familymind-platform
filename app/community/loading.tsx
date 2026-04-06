import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <header className="mb-10">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-3 h-5 w-80" />
        </header>

        {/* Room grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
