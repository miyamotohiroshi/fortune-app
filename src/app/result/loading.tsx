import { getCurrentUser } from '@/src/lib/session'
import { AdminTabNav } from '@/src/components/admin/AdminTabNav'
import { LoadingOverlay } from '@/src/components/ui/LoadingOverlay'

// 「自分の結果」遷移中のフォールバック。上部の切り替えタブ（自分の結果／占断履歴）は
// page.tsxと同じ見た目のまま表示し続け、その下のコンテンツ領域だけにローディングを出す
export default async function Loading() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">
        {user?.role === 'admin' && <AdminTabNav active="self" />}

        <LoadingOverlay text="占断結果を計算中" fullScreen={false} />
      </div>
    </div>
  )
}
