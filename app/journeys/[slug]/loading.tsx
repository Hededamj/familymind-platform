import { Card, CardContent } from '@/components/ui/card'

export default function JourneyLoading() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-6 pb-24 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
