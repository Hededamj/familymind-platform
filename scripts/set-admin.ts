import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'jacob@hummelconsult.dk' } })
  if (!user) {
    console.log('User not found')
    return
  }
  console.log('Found user:', user.id, 'current role:', user.role)
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  console.log('Updated to:', updated.role)
}

main()
  .finally(() => prisma.$disconnect())
