import { Award } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlumniBadgeProps = {
  journeyTitle: string
  size?: 'sm' | 'default'
}

export function AlumniBadge({ journeyTitle, size = 'default' }: AlumniBadgeProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[9px] gap-0.5'
      : 'px-2 py-0.5 text-[10px] gap-1'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-medium bg-accent/10 text-accent border border-accent/20',
        sizeClasses
      )}
      aria-label={`Har gennemført ${journeyTitle}`}
    >
      <Award className={size === 'sm' ? 'size-2.5' : 'size-3'} />
      Har gennemført {journeyTitle}
    </span>
  )
}
