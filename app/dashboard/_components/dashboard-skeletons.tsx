import { Skeleton } from '@/components/ui/skeleton'

export function CommunityPillsSkeleton() {
  return (
    <div className="flex gap-2">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-28 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  )
}

export function PersonalizedWelcomeSkeleton() {
  return <Skeleton className="mb-6 h-4 w-72" />
}

export function CheckInSkeleton() {
  return (
    <section>
      <Skeleton className="mb-2 h-5 w-40" />
      <Skeleton className="h-24 rounded-2xl" />
    </section>
  )
}

export function WeeklyFocusSkeleton() {
  return (
    <section>
      <Skeleton className="mb-2 h-5 w-32" />
      <Skeleton className="h-40 rounded-2xl" />
    </section>
  )
}

export function CoursesSkeleton() {
  return (
    <section>
      <Skeleton className="mb-2 h-5 w-28" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </section>
  )
}

export function RecommendationsSkeleton() {
  return (
    <section>
      <Skeleton className="mb-4 h-6 w-36" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </section>
  )
}
