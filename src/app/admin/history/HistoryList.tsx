'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { DeleteHistoryButton } from './DeleteHistoryButton'

export type HistoryItem = {
  id: string
  name: string
  birthdayLabel: string
  total: number | null
  love: number | null
  work: number | null
  friend: number | null
}

type SortKey = 'default' | 'total' | 'love' | 'work' | 'friend'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'default', label: '登録順' },
  { key: 'total', label: '総合点高い順' },
  { key: 'love', label: '恋愛点高い順' },
  { key: 'work', label: '仕事点高い順' },
  { key: 'friend', label: '友人点高い順' },
]

/** null は常に末尾。数値は降順。 */
function byScore(get: (i: HistoryItem) => number | null) {
  return (a: HistoryItem, b: HistoryItem) => {
    const va = get(a)
    const vb = get(b)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    return vb - va
  }
}

export function HistoryList({ items }: { items: HistoryItem[] }) {
  const [sort, setSort] = useState<SortKey>('default')

  const sorted = useMemo(() => {
    if (sort === 'default') return items
    const arr = [...items]
    if (sort === 'total') arr.sort(byScore((i) => i.total))
    else if (sort === 'love') arr.sort(byScore((i) => i.love))
    else if (sort === 'work') arr.sort(byScore((i) => i.work))
    else if (sort === 'friend') arr.sort(byScore((i) => i.friend))
    return arr
  }, [items, sort])

  return (
    <div className="space-y-3">
      {/* 並び替えセレクト */}
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          並び替え
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs text-slate-100 rounded-lg px-3 py-2 border border-purple-900/40 focus:outline-none focus:border-purple-500/60"
            style={{ background: 'rgba(18,18,42,0.95)' }}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} style={{ background: '#12122a' }}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sorted.map((it) => (
        <HistoryRow key={it.id} it={it} />
      ))}
    </div>
  )
}

function Score({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-[9px] ${color} leading-none`} style={{ opacity: 0.8 }}>
        {label}
      </p>
      <p className={`text-base font-bold ${color} leading-tight underline decoration-dotted underline-offset-2`}>
        {value === null ? '—' : value}
        {value !== null && <span className="text-[9px] text-slate-500 ml-0.5">点</span>}
      </p>
    </div>
  )
}

function HistoryRow({ it }: { it: HistoryItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`relative rounded-2xl border border-purple-900/30 p-4 flex items-center justify-between gap-2 ${open ? 'z-30' : ''}`}
      style={{ background: 'rgba(12,12,34,0.95)' }}
    >
      <Link href={`/admin/history/${it.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{it.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{it.birthdayLabel}</p>
      </Link>

      <Link
        href={`/result?compat=${it.id}`}
        className="shrink-0 flex items-stretch gap-2 px-2 py-1 rounded-lg hover:bg-pink-500/10 transition-colors"
        title={`${it.name}さんとの相性を見る`}
      >
        <Score label="総合" value={it.total} color="text-pink-300" />
        <div className="w-px bg-slate-700/50" />
        <Score label="恋愛" value={it.love} color="text-rose-300" />
        <div className="w-px bg-slate-700/50" />
        <Score label="仕事" value={it.work} color="text-sky-300" />
        <div className="w-px bg-slate-700/50" />
        <Score label="友人" value={it.friend} color="text-emerald-300" />
      </Link>

      {/* ⋯ メニュー */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="メニュー"
          aria-expanded={open}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg leading-none text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          ⋯
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 top-full mt-1 z-20 min-w-28 rounded-lg border border-purple-900/50 py-1 shadow-xl overflow-hidden"
              style={{ background: 'rgba(18,18,42,0.98)' }}
            >
              <Link
                href={`/admin/history/${it.id}/edit`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-purple-300 hover:bg-purple-500/10 transition-colors"
              >
                編集
              </Link>
              <DeleteHistoryButton
                id={it.id}
                name={it.name}
                className="block w-full text-left px-4 py-2.5 text-sm text-red-400/90 hover:bg-red-500/10 transition-colors"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
