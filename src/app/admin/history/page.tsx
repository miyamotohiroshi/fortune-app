import Link from 'next/link'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'
import { DeleteHistoryButton } from './DeleteHistoryButton'

export default async function AdminHistoryPage() {
  const user = await getCurrentUser()

  const histories = await prisma.fortuneHistory.findMany({
    where: { adminUserId: user!.id },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

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
            {histories.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl border border-purple-900/30 p-4 flex items-center justify-between gap-3"
                style={{ background: 'rgba(12,12,34,0.95)' }}
              >
                <Link href={`/admin/history/${h.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{h.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    最終更新: {h.updatedAt.toLocaleDateString('ja-JP')}
                  </p>
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

        <div className="pt-2">
          <Link href="/result" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← 自分の占い結果へ戻る
          </Link>
        </div>

      </div>
    </div>
  )
}
