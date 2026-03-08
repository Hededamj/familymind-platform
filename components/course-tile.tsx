import Image from "next/image"
import Link from "next/link"
import { FileText, Clock, ArrowRight, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CourseTileProps = {
  title: string
  description?: string | null
  imageUrl?: string | null
  href: string
  lessonCount?: number
  duration?: string
  progress?: number // 0-100
  phaseName?: string
  priceDisplay?: string
  variant?: "active" | "recommended" | "completed" | "browse"
  ctaLabel?: string
}

const defaultCtaLabels: Record<NonNullable<CourseTileProps["variant"]>, string> = {
  active: "Fortsæt",
  completed: "Se igen",
  recommended: "Læs mere",
  browse: "Start",
}

export function CourseTile({
  title,
  description,
  imageUrl,
  href,
  lessonCount,
  duration,
  progress,
  phaseName,
  priceDisplay,
  variant = "browse",
  ctaLabel,
}: CourseTileProps) {
  const isCompleted = variant === "completed"

  const resolvedCtaLabel =
    ctaLabel ??
    (variant === "browse" && priceDisplay
      ? `Køb — ${priceDisplay}`
      : defaultCtaLabels[variant])

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[280px] flex-col rounded-xl border bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]",
        isCompleted && "opacity-80"
      )}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-sand">
            <FileText className="size-12 text-muted-foreground/20" />
          </div>
        )}

        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
            <CheckCircle2 className="size-10 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {phaseName && (
          <span className="mb-1 text-xs font-medium text-accent">
            {phaseName}
          </span>
        )}

        <h3 className="font-serif text-lg leading-snug">{title}</h3>

        {description && (
          <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Metadata */}
        {(lessonCount != null || duration) && (
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {lessonCount != null && (
              <span className="flex items-center gap-1">
                <FileText className="size-3.5" />
                {lessonCount} lektioner
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {duration}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {progress != null && progress > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Fremskridt</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-[1.5px] w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Button
            variant={isCompleted ? "outline" : "default"}
            className={cn(
              "w-full min-h-[44px]",
              !isCompleted && "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
            asChild
          >
            <span>
              {resolvedCtaLabel}
              <ArrowRight className="size-4" />
            </span>
          </Button>
        </div>
      </div>
    </Link>
  )
}
