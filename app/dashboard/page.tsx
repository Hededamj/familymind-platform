import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="size-4" />
            Indstillinger
          </Link>
        </div>
        <p className="mt-4 text-muted-foreground">
          Din personlige oversigt kommer snart.
        </p>
      </div>
    </div>
  )
}
