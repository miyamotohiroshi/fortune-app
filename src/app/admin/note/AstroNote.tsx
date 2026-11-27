'use client'

import { useMemo, useState, type ReactNode } from 'react'
// 型のみ import（データ本体はサーバーから props で受け取る）
import type { AstroNoteCategory, AstroNoteCategoryId, AstroNoteItem } from '@/src/data/astro-note'

type Props = {
  categories: AstroNoteCategory[]
  bodies: Record<string, string>
  data: Record<AstroNoteCategoryId, AstroNoteItem[]>
  /** URL の ?cat= から決めた初期タブ（リロードしても同じタブを開く） */
  initialCat: AstroNoteCategoryId
}

const DEG_RE = /((?:\d+度・)*\d+度)/g

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 段落内の角度表記を強調し、検索語をハイライトする */
function renderParagraph(para: string, q: string): ReactNode[] {
  const nodes: ReactNode[] = []
  para.split(DEG_RE).forEach((chunk, i) => {
    if (!chunk) return
    // split にキャプチャグループがあるので奇数番目が角度表記
    if (i % 2 === 1) {
      nodes.push(
        <span key={`d${i}`} className="text-amber-300 font-medium">
          {chunk}
        </span>,
      )
      return
    }
    if (!q) {
      nodes.push(chunk)
      return
    }
    chunk.split(new RegExp(`(${escapeRe(q)})`, 'g')).forEach((part, j) => {
      if (!part) return
      nodes.push(
        j % 2 === 1 ? (
          <mark key={`q${i}-${j}`} className="bg-amber-400/30 text-amber-100 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )
    })
  })
  return nodes
}

export function AstroNote({ categories, bodies, data, initialCat }: Props) {
  const [cat, setCat] = useState<AstroNoteCategoryId>(initialCat)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [starOnly, setStarOnly] = useState(false)
  const [q, setQ] = useState('')
  const [openIds, setOpenIds] = useState<Set<number>>(new Set())

  const items = data[cat]
  const query = q.trim()

  const hits = useMemo(
    () =>
      items
        .map((it, idx) => ({ it, idx }))
        .filter(
          ({ it }) =>
            [...selected].every((b) => it.bodies.includes(b)) &&
            (!starOnly || it.star) &&
            (!query || it.text.includes(query) || it.bodies.join('—').includes(query)),
        ),
    [items, selected, starOnly, query],
  )

  const changeCat = (id: AstroNoteCategoryId) => {
    setCat(id)
    setOpenIds(new Set())
    // 再読み込みでも同じタブを開けるよう URL に残す（画面遷移はしない）
    window.history.replaceState(null, '', `?cat=${id}`)
    window.scrollTo(0, 0)
  }

  // キーワード検索中は本文に一致したものを開いた状態にする
  const changeQuery = (value: string) => {
    setQ(value)
    const v = value.trim()
    setOpenIds(v ? new Set(items.flatMap((it, idx) => (it.text.includes(v) ? [idx] : []))) : new Set())
  }

  const toggleBody = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleOpen = (idx: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const clearAll = () => {
    setSelected(new Set())
    setStarOnly(false)
    setQ('')
    setOpenIds(new Set())
  }

  // 2天体だけの項目しかないタブ（ディレクションなど）は、1つめの天体ごとにまとめる
  const pairOnly = items.every((it) => it.bodies.length === 2)
  const category = categories.find((c) => c.id === cat)

  return (
    <div className="space-y-4">
      {/* カテゴリタブ */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]">
        {categories.map((c) => {
          const active = c.id === cat
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => changeCat(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors border ${
                active
                  ? 'text-white font-bold border-transparent'
                  : 'text-slate-400 hover:text-slate-200 border-purple-900/40 bg-[#14142a]'
              }`}
              style={active ? { background: 'linear-gradient(to right, #8b5cf6, #4f46e5)' } : undefined}
            >
              {c.name}
              <span className="ml-1.5 text-xs opacity-60">{data[c.id].length}</span>
            </button>
          )
        })}
      </div>

      {/* 検索・絞り込み */}
      <div
        className="rounded-2xl border border-purple-900/30 p-4 space-y-3"
        style={{ background: 'rgba(20,20,40,0.8)' }}
      >
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/80 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="キーワード検索（例：結婚、0度）"
            className="w-full rounded-xl bg-[#1a1a3a] border border-purple-900/50 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/70"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">天体で絞り込み（選んだ天体をすべて含むもの）</span>
          <button type="button" onClick={clearAll} className="text-xs text-purple-300 hover:text-purple-200">
            クリア
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(bodies).map(([name, symbol]) => {
            const on = selected.has(name)
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleBody(name)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  on
                    ? 'border-purple-400 bg-purple-600/40 text-white'
                    : 'border-purple-900/50 bg-[#1a1a3a] text-slate-300 hover:border-purple-600/60'
                }`}
              >
                <span className="mr-1 opacity-70">{symbol}</span>
                {name}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-pressed={starOnly}
          onClick={() => setStarOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            starOnly
              ? 'border-amber-400/70 bg-amber-500/20 text-amber-200'
              : 'border-purple-900/50 bg-[#1a1a3a] text-slate-300 hover:border-amber-500/50'
          }`}
        >
          ★ 印のみ
        </button>
      </div>

      {category?.source && <p className="text-xs text-slate-500 px-1">出典：{category.source}</p>}

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">まだデータがありません</p>
      ) : (
        <>
          <div className="flex items-center gap-3 px-1">
            <span className="mr-auto text-xs text-slate-400">
              {hits.length} / {items.length} 件
            </span>
            <button
              type="button"
              onClick={() => setOpenIds(new Set(hits.map((h) => h.idx)))}
              className="text-xs text-purple-300 hover:text-purple-200"
            >
              すべて開く
            </button>
            <button
              type="button"
              onClick={() => setOpenIds(new Set())}
              className="text-xs text-purple-300 hover:text-purple-200"
            >
              すべて閉じる
            </button>
          </div>

          {hits.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">該当する項目がありません</p>
          ) : (
            <div className="space-y-2">
              {hits.map(({ it, idx }, i) => {
                const group = pairOnly ? it.bodies[0] : it.bodies.slice(0, 2).join('—')
                const prev = hits[i - 1]?.it
                const prevGroup = prev ? (pairOnly ? prev.bodies[0] : prev.bodies.slice(0, 2).join('—')) : null
                const open = openIds.has(idx)
                return (
                  <div key={idx}>
                    {group !== prevGroup && (
                      <div className="flex items-center gap-2 pt-5 pb-2 first:pt-1">
                        <span className="w-1 h-4 rounded-full bg-purple-500" />
                        <h2 className="text-sm font-bold text-purple-200 tracking-wide">{group}</h2>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl border transition-colors ${
                        it.intro ? 'border-purple-600/40' : 'border-purple-900/30'
                      } ${open ? 'bg-[#16163a]' : 'bg-[#11112a] hover:border-purple-700/50'}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleOpen(idx)}
                        aria-expanded={open}
                        className="w-full flex items-center gap-2 px-4 py-3.5 text-left"
                      >
                        <span className="text-sm font-medium text-white">{it.bodies.join('—')}</span>
                        {it.intro && (
                          <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] text-purple-200">
                            解説
                          </span>
                        )}
                        {it.star && <span className="text-amber-300 text-sm">★</span>}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className={`ml-auto w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 space-y-2.5 text-sm leading-relaxed text-slate-300">
                          {it.text.split('\n').map((para, k) => (
                            <p key={k}>{renderParagraph(para, query)}</p>
                          ))}
                          <p className="pt-1 text-right text-xs text-slate-500">
                            {it.note && <>メモ：{it.note} ・ </>}p.{it.page}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <p className="pt-4 text-center text-xs text-slate-500 leading-relaxed">
        <span className="text-amber-300">★</span>＝本に手書きで星印があった項目 ／{' '}
        <span className="text-amber-300">黄色</span>＝角度の記述 ／ p.＝本のページ
      </p>
    </div>
  )
}
