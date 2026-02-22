export default function BrowseLoading() {
  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-2 h-3 w-24 animate-pulse rounded-full bg-sand" />
          <div className="mx-auto mb-2 h-9 w-64 animate-pulse rounded-xl bg-sand" />
          <div className="mx-auto h-4 w-80 animate-pulse rounded-full bg-sand" />
        </div>

        {/* Filter pills */}
        <div className="mb-8 flex justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-sand"
            />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white">
              <div className="aspect-[16/9] animate-pulse rounded-t-2xl bg-sand" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-16 animate-pulse rounded-full bg-sand" />
                <div className="h-5 w-40 animate-pulse rounded-full bg-sand" />
                <div className="h-4 w-full animate-pulse rounded-full bg-sand" />
                <div className="border-t border-border pt-4 flex justify-between">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-sand" />
                  <div className="h-4 w-20 animate-pulse rounded-full bg-sand" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
