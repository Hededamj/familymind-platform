import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const tables = [
  'User', 'Tenant', 'Subscription', 'Payment',
  'CommunityRoom', 'CommunityPost', 'Comment',
  'Product', 'BundleItem', 'CorpusEntry',
  'Entitlement', 'Journey', 'ContentUnit',
  'CourseLesson', 'CourseModule', 'DiscountCode',
];

const results = {};
for (const t of tables) {
  try {
    const r = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${t}"`);
    results[t] = r[0].c;
  } catch (e) {
    results[t] = `ERR: ${e.message.split('\n')[0].slice(0, 80)}`;
  }
}
console.log(JSON.stringify(results, null, 2));
await prisma.$disconnect();
