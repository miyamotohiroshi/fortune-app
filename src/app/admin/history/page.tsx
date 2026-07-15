import Link from 'next/link'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'
import { synastryFromBirth } from '@/src/lib/astrology/synastry-server'
import { DeleteHistoryButton } from './DeleteHistoryButton'
import { AdminTabNav } from '@/src/components/admin/AdminTabNav'

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
  const scored = histories.map((h) => {
    const r = synastryFromBirth(adminBirth, {
      birthday: h.birthday.toISOString(),
      birthTime: h.birthTime,
      birthCity: h.birthCity,
    })
    return { h, total: r.total, love: r.categories.恋愛, work: r.categories.仕事 }
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

        {histories.length === 0 ? (
          <div
            className="rounded-2xl border border-purple-900/30 p-8 text-center"
            style={{ background: 'rgba(12,12,34,0.95)' }}
          >
            <p className="text-sm text-slate-400">まだ履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scored.map(({ h, total, love, work }) => (
              <div
                key={h.id}
                className="rounded-2xl border border-purple-900/30 p-4 flex items-center justify-between gap-3"
                style={{ background: 'rgba(12,12,34,0.95)' }}
              >
                <Link href={`/admin/history/${h.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{h.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {h.birthday.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </p>
                </Link>
                <Link
                  href={`/result?compat=${h.id}`}
                  className="shrink-0 flex items-stretch gap-2 px-2 py-1 rounded-lg hover:bg-pink-500/10 transition-colors"
                  title={`${h.name}さんとの相性を見る`}
                >
                  <div className="text-center">
                    <p className="text-[9px] text-pink-400/80 leading-none">総合</p>
                    <p className="text-base font-bold text-pink-300 leading-tight underline decoration-dotted decoration-pink-400/40 underline-offset-2">
                      {total === null ? '—' : total}
                      {total !== null && <span className="text-[9px] text-slate-500 ml-0.5">点</span>}
                    </p>
                  </div>
                  <div className="w-px bg-slate-700/50" />
                  <div className="text-center">
                    <p className="text-[9px] text-rose-400/80 leading-none">恋愛</p>
                    <p className="text-base font-bold text-rose-300 leading-tight underline decoration-dotted decoration-rose-400/40 underline-offset-2">
                      {love === null || love === undefined ? '—' : love}
                      {love !== null && love !== undefined && <span className="text-[9px] text-slate-500 ml-0.5">点</span>}
                    </p>
                  </div>
                  <div className="w-px bg-slate-700/50" />
                  <div className="text-center">
                    <p className="text-[9px] text-sky-400/80 leading-none">仕事</p>
                    <p className="text-base font-bold text-sky-300 leading-tight underline decoration-dotted decoration-sky-400/40 underline-offset-2">
                      {work === null || work === undefined ? '—' : work}
                      {work !== null && work !== undefined && <span className="text-[9px] text-slate-500 ml-0.5">点</span>}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/history/${h.id}/edit`}
                    className="text-xs text-purple-400/80 hover:text-purple-300 transition-colors px-2 py-1"
                  >
                    編集
                  </Link>
                  <DeleteHistoryButton id={h.id} name={h.name} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
