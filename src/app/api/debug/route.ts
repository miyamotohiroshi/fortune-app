import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const results: Record<string, string> = {}
  
  try {
    const count = await prisma.zodiac.count()
    results.zodiacCount = `OK: ${count}`
  } catch(e: unknown) {
    results.zodiacCount = `ERROR: ${e instanceof Error ? e.constructor.name + ': ' + e.message : String(e)}`
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { email: 'nonexistent@example.com' } })
    results.userQuery = `OK: ${user}`
  } catch(e: unknown) {
    results.userQuery = `ERROR: ${e instanceof Error ? e.constructor.name + ': ' + e.message : String(e)}`
  }
  
  try {
    const hash = await bcrypt.hash('testpassword', 10)
    results.bcrypt = `OK: hash_created`
  } catch(e: unknown) {
    results.bcrypt = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }
  
  return NextResponse.json(results)
}

export async function POST() {
  // Test server action equivalent behavior
  const results: Record<string, string> = {}
  
  try {
    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } })
    results.userQuery = `OK: ${user}`
  } catch(e: unknown) {
    results.userQuery = `ERROR: ${e instanceof Error ? e.constructor.name + ': ' + e.message : String(e)}`
  }
  
  try {
    const hash = await bcrypt.hash('testpassword', 10)
    results.bcrypt = `OK: hash_created`
  } catch(e: unknown) {
    results.bcrypt = `ERROR: ${e instanceof Error ? e.message : String(e)}`
  }
  
  try {
    const ts = Date.now()
    const u = await prisma.user.create({
      data: {
        nickname: 'DebugUser',
        email: `debug_${ts}@test.com`,
        password: 'hashed',
        birthday: new Date('1990-01-01'),
        zodiacDayId: 1,
        genmeiId: 1,
      }
    })
    results.userCreate = `OK: ${u.id}`
    await prisma.user.delete({ where: { id: u.id } })
    results.userDelete = 'OK'
  } catch(e: unknown) {
    results.userCreate = `ERROR: ${e instanceof Error ? e.constructor.name + ': ' + e.message : String(e)}`
  }
  
  return NextResponse.json(results)
}
