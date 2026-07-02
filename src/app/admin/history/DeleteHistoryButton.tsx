'use client'

import { deleteHistory } from '@/src/app/actions/adminHistory'

export function DeleteHistoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteHistory.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`${name}さんの履歴を削除しますか？この操作は取り消せません。`)) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="text-xs text-red-400/80 hover:text-red-400 transition-colors px-2 py-1"
      >
        削除
      </button>
    </form>
  )
}
