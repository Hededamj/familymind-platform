'use client'

import { useRouter } from 'next/navigation'
import { TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ClickableRowProps = {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * En TableRow der navigerer til `href` når man klikker på den.
 * Klik på interaktive elementer (knapper, links, menuer) bobler IKKE op
 * så længe de bruger stopPropagation eller Radix's default adfærd.
 */
export function ClickableRow({ href, children, className }: ClickableRowProps) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLTableRowElement>) {
    // Hvis klikket kommer fra et interaktivt element, gør ingenting.
    const target = e.target as HTMLElement
    if (target.closest('button, a, [role="menuitem"], [data-slot="dropdown-menu-trigger"]')) {
      return
    }
    router.push(href)
  }

  return (
    <TableRow
      onClick={handleClick}
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent/60 hover:shadow-sm',
        className
      )}
    >
      {children}
    </TableRow>
  )
}
