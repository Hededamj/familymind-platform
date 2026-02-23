import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function logConsent(data: {
  userId?: string
  ip: string
  statistics: boolean
  marketing: boolean
}) {
  return prisma.cookieConsent.create({
    data: {
      userId: data.userId || null,
      ipHash: hashIp(data.ip),
      statistics: data.statistics,
      marketing: data.marketing,
    },
  })
}
