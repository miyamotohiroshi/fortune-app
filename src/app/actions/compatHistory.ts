'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'

/** 1会員あたりの相性履歴の上限（DBを圧迫しないため） */
const MAX_COMPAT_HISTORY = 10

export type CompatPartnerInput = {
  name: string
  birthday: string // "YYYY-MM-DD"
  birthTime: string | null // "HH:MM"
  birthCity: string | null
}

/**
 * 会員が相性占断した相手を履歴に保存する（名前+生年月日で上書き）。
 * 保存後、上限を超えたら古い順に削除して最大10件に保つ。
 */
export async function saveCompatHistory(partner: CompatPartnerInput): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const name = partner.name.trim()
  if (!name || !partner.birthday) return

  const birthday = new Date(partner.birthday) // "YYYY-MM-DD" → UTC 0時（JST表示で同日）

  await prisma.compatHistory.upsert({
    where: { userId_name_birthday: { userId: user.id, name, birthday } },
    update: { birthTime: partner.birthTime, birthCity: partner.birthCity },
    create: { userId: user.id, name, birthday, birthTime: partner.birthTime, birthCity: partner.birthCity },
  })

  // 上限を超えた古い履歴を削除
  const rows = await prisma.compatHistory.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (rows.length > MAX_COMPAT_HISTORY) {
    const toDelete = rows.slice(MAX_COMPAT_HISTORY).map((r) => r.id)
    await prisma.compatHistory.deleteMany({ where: { id: { in: toDelete } } })
  }

  revalidatePath('/result')
}

/** 会員が自分の相性履歴を1件削除する */
export async function deleteCompatHistory(id: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return
  await prisma.compatHistory.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/result')
}
