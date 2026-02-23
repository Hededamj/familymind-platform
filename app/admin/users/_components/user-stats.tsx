import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

type Stats = {
  total: number
  active: number
  trial: number
  newUsers: number
  churned: number
}

const statCards = [
  { key: 'total' as const, label: 'Brugere', href: '/admin/users' },
  { key: 'active' as const, label: 'Aktive', href: '/admin/users?status=ACTIVE' },
  { key: 'trial' as const, label: 'Trial', href: '/admin/users?status=TRIAL' },
  { key: 'newUsers' as const, label: 'Nye (7d)', href: null },
  { key: 'churned' as const, label: 'Churned', href: '/admin/users?status=CHURNED' },
]

export function UserStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {statCards.map((card) => {
        const content = (
          <Card
            className={
              card.href
                ? 'cursor-pointer transition-colors hover:bg-accent/50'
                : ''
            }
          >
            <CardContent className="py-0">
              <p className="text-3xl font-bold">{stats[card.key]}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        )

        if (card.href) {
          return (
            <Link key={card.key} href={card.href}>
              {content}
            </Link>
          )
        }

        return <div key={card.key}>{content}</div>
      })}
    </div>
  )
}
