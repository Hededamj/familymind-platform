import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Tak for dit køb!</CardTitle>
          <CardDescription className="text-base">
            Du har nu adgang til dit indhold. Gå til dit dashboard for at komme
            i gang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">Gå til dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
