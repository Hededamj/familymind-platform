import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header with button */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-1 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full border-t" />
        ))}
      </div>
    </div>
  )
}
