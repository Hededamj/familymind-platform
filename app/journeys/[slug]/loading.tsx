export default function JourneyLoading() {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Back link */}
        <div className="h-4 w-20 animate-pulse rounded-full bg-sand" />

        {/* Header */}
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded-full bg-sand" />
          <div className="h-8 w-64 animate-pulse rounded-xl bg-sand" />
          <div className="h-4 w-full animate-pulse rounded-full bg-sand" />
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="h-4 w-40 animate-pulse rounded-full bg-sand mb-2" />
          <div className="h-2 w-full animate-pulse rounded-full bg-sand" />
        </div>

        {/* Phase sections */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-7 animate-pulse rounded-full bg-sand" />
              <div className="h-5 w-40 animate-pulse rounded-full bg-sand" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 w-full animate-pulse rounded-xl bg-sand" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
