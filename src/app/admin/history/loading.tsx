import { AdminTabNav } from '@/src/components/admin/AdminTabNav'
import { LoadingOverlay } from '@/src/components/ui/LoadingOverlay'

// 占断履歴一覧へ遷移中のフォールバック。一覧は全員分の相性スコアをサーバーで計算するため時間がかかり、
// loading.tsx が無いと詳細ページから戻る間に画面が固まったように見えていた。
// 上部の切り替えタブはpage.tsxと同じ見た目のまま表示し、その下だけにローディングを出す
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">
        <AdminTabNav active="history" />

        <LoadingOverlay text="占断履歴を読み込み中" fullScreen={false} />
      </div>
    </div>
  )
}
