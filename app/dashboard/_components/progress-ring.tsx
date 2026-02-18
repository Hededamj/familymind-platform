import { cn } from '@/lib/utils'

interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ProgressRing({
  percent,
  size = 80,
  strokeWidth = 6,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className={cn('relative', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-lg font-bold">{percent}%</span>
      </div>
    </div>
  )
}
