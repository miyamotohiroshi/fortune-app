import Link from 'next/link'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'
import { synastryFromBirth } from '@/src/lib/astrology/synastry-server'
import { AdminTabNav } from '@/src/components/admin/AdminTabNav'
import { HistoryList, type HistoryItem } from './HistoryList'

export default async function AdminHistoryPage() {
  const user = await getCurrentUser()

  const histories = await prisma.fortuneHistory.findMany({
    where: { adminUserId: user!.id },
    orderBy: { updatedAt: 'desc' },
  })

  // 管理者本人 × 各対象者の相性（総合点）を算出
  const adminBirth = {
    birthday: user!.birthday.toISOString(),
    birthTime: user!.birthTime,
    birthCity: user!.birthCity,
  }
  const items: HistoryItem[] = histories.map((h) => {
    const r = synastryFromBirth(adminBirth, {
      birthday: h.birthday.toISOString(),
      birthTime: h.birthTime,
      birthCity: h.birthCity,
    })
    return {
      id: h.id,
      name: h.name,
      birthdayLabel: h.birthday.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      total: r.total,
      love: r.categories.恋愛,
      work: r.categories.仕事,
      friend: r.categories.友人,
    }
  })

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

        <AdminTabNav active="history" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-purple-400 tracking-widest mb-1">管理者メニュー</p>
            <h1 className="text-3xl font-bold text-white">占断履歴</h1>
          </div>
          <div
            className="rounded-xl p-px"
            style={{ background: 'linear-gradient(to right, #d946ef, #8b5cf6, #4f46e5)' }}
          >
            <Link
              href="/admin/lookup"
              className="block text-sm font-medium text-white px-4 py-2.5 rounded-[11px] hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(to right, #2e1065, #1e1b4b)' }}
            >
              新しく占う
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div
            className="rounded-2xl border border-purple-900/30 p-8 text-center"
            style={{ background: 'rgba(12,12,34,0.95)' }}
          >
            <p className="text-sm text-slate-400">まだ履歴がありません</p>
          </div>
        ) : (
          <HistoryList items={items} />
        )}

      </div>
    </div>
  )
}
