import { PartyPopper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface CompletedJourneyCardProps {
  journeyTitle: string
}

export function CompletedJourneyCard({
  journeyTitle,
}: CompletedJourneyCardProps) {
  return (
    <Card className="overflow-hidden border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/20">
      <CardContent className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <PartyPopper className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
          Tillykke!
        </h3>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          Du har gennemført{' '}
          <span className="font-semibold">{journeyTitle}</span>
        </p>
      </CardContent>
    </Card>
  )
}
