export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 pb-24 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-full bg-sand" />
          <div className="h-9 w-56 animate-pulse rounded-xl bg-sand" />
          <div className="h-4 w-72 animate-pulse rounded-full bg-sand" />
        </div>

        {/* Message banner skeleton */}
        <div className="h-24 w-full animate-pulse rounded-2xl bg-sand" />

        {/* Journey card skeleton */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded-full bg-sand" />
            <div className="h-2 w-full animate-pulse rounded-full bg-sand" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-sand" />
          </div>
        </div>

        {/* Content cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-5">
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-full bg-sand" />
                <div className="h-3 w-full animate-pulse rounded-full bg-sand" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
