import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="mb-2 text-6xl font-serif text-primary/20">404</p>
        <h1 className="mb-2 font-serif text-2xl">Siden blev ikke fundet</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Den side du leder efter findes ikke eller er blevet flyttet.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/">Gå til forsiden</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">Til dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
