import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function getConnectionUrl() {
  const url = process.env.POSTGRES_PRISMA_URL;
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('pgbouncer', 'true');
    parsed.searchParams.set('connection_limit', '1');
    return parsed.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: getConnectionUrl() } },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;