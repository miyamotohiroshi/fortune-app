import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  results.nodeVersion = process.version
  results.platform = process.platform
  results.hasPostgresUrl = !!process.env.POSTGRES_PRISMA_URL
  results.urlPrefix = process.env.POSTGRES_PRISMA_URL?.slice(0, 50) + '...'
  results.hasSessionSecret = !!process.env.SESSION_SECRET

  try {
    const { PrismaNeonHTTP } = await import('@prisma/adapter-neon')
    results.adapterImport = 'OK'
    const adapter = new PrismaNeonHTTP(process.env.POSTGRES_PRISMA_URL!, {
      arrayMode: false,
      fullResults: false,
    })
    results.adapterCreate = 'OK'

    const { PrismaClient } = await import('@prisma/client')
    const client = new PrismaClient({ adapter })
    results.clientCreate = 'OK'

    const count = await client.user.count()
    results.userCount = count
    results.dbQuery = 'OK'
  } catch (e) {
    results.error = {
      name: e instanceof Error ? e.constructor.name : 'unknown',
      message: e instanceof Error ? e.message : String(e),
    }
  }

  return NextResponse.json(results)
}
