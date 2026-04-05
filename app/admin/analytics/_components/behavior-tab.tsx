'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MessageSquare, Reply } from 'lucide-react'

type BehaviorData = {
  popularContent: Array<{ title: string; type: string; completed: number; completionRate: number }>
  activityByHour: Array<{ hour: number; count: number }>
  popularTags: Array<{ name: string; count: number }>
  engagementTrend: Array<{ week: string; avgPerUser: number }>
  community: {
    newPosts: number
    newReplies: number
    topRooms: Array<{ name: string; count: number }>
  }
}

const hourConfig: ChartConfig = {
  count: { label: 'Interaktioner', color: 'hsl(220, 90%, 56%)' },
}

const tagConfig: ChartConfig = {
  count: { label: 'Interaktioner', color: 'hsl(142, 76%, 36%)' },
}

const engagementConfig: ChartConfig = {
  avgPerUser: { label: 'Gns. per bruger', color: 'hsl(280, 65%, 60%)' },
}

const typeLabels: Record<string, string> = {
  VIDEO: 'Video',
  TEXT: 'Tekst',
  EXERCISE: 'Øvelse',
  AUDIO: 'Lyd',
}

export function BehaviorTab({ data }: { data: BehaviorData }) {
  return (
    <div className="space-y-6">
      {/* Popular content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 populært indhold</CardTitle>
        </CardHeader>
        <CardContent>
          {data.popularContent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Ingen indholdsdata i perioden</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Fuldført</TableHead>
                    <TableHead className="text-right">Completion rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.popularContent.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeLabels[c.type] ?? c.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{c.completed}</TableCell>
                      <TableCell className="text-right">{c.completionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity by hour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktivitet over døgnet</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={hourConfig} className="h-[250px]">
              <BarChart data={data.activityByHour}>
                <XAxis dataKey="hour" fontSize={12} tickFormatter={(v) => `${v}:00`} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Popular tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Populære temaer</CardTitle>
          </CardHeader>
          <CardContent>
            {data.popularTags.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Ingen tag-data</p>
            ) : (
              <ChartContainer config={tagConfig} className="h-[250px]">
                <BarChart data={data.popularTags} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement-trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.engagementTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Ingen data</p>
            ) : (
              <ChartContainer config={engagementConfig} className="h-[250px]">
                <LineChart data={data.engagementTrend}>
                  <XAxis dataKey="week" tickFormatter={(v) => v.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="avgPerUser" stroke="var(--color-avgPerUser)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Community activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Community-aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <MessageSquare className="size-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{data.community.newPosts}</p>
                  <p className="text-xs text-muted-foreground">Nye indlæg</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Reply className="size-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{data.community.newReplies}</p>
                  <p className="text-xs text-muted-foreground">Svar</p>
                </div>
              </div>
            </div>
            {data.community.topRooms.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Mest aktive rum</p>
                <div className="space-y-2">
                  {data.community.topRooms.map((room, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm font-medium">{room.name}</span>
                      <Badge variant="secondary">{room.count} indlæg</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
