export default function ContentLoading() {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back link */}
        <div className="mb-6 h-4 w-20 animate-pulse rounded-full bg-sand" />

        {/* Video placeholder */}
        <div className="mb-6 aspect-video w-full animate-pulse rounded-2xl bg-sand" />

        {/* Meta badges */}
        <div className="mb-3 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-sand" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-sand" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-sand" />
        </div>

        {/* Title */}
        <div className="mb-4 h-8 w-3/4 animate-pulse rounded-xl bg-sand" />

        {/* Tags */}
        <div className="mb-6 flex gap-1.5">
          <div className="h-6 w-20 animate-pulse rounded-full bg-sand" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-sand" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-sand" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-sand" />
          <div className="h-4 w-4/6 animate-pulse rounded-full bg-sand" />
        </div>
      </div>
    </div>
  )
}
