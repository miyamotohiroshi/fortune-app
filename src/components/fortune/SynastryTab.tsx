'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { runSynastry } from '@/src/app/actions/synastry'
import { saveCompatHistory, deleteCompatHistory } from '@/src/app/actions/compatHistory'
import type { SynResult, SynCategory } from '@/src/lib/astrology/synastry'

/** 管理者が選べる登録済みの人 */
export type RegisteredPerson = {
  id?: string
  name: string
  birthday: string // ISO
  birthTime: string | null
  birthCity: string | null
}

/** 会員の相性履歴（点数つき） */
export type CompatHistoryItem = {
  id: string
  name: string
  birthday: string // "YYYY-MM-DD"（再計算用）
  birthdayLabel: string // 表示用
  birthTime: string | null
  birthCity: string | null
  total: number | null
  love: number | null
  work: number | null
  friend: number | null
}

type Props = {
  selfBirthday: string // ISO
  selfBirthTime: string | null
  selfBirthCity: string | null
  /** 管理者のみ: 登録済みの人から選べる */
  people?: RegisteredPerson[]
  /** 初期表示で自動選択・自動計算する登録済みの人のID */
  preselectId?: string
  /** 会員: サブタブ（相性を占う／履歴）と自動保存を有効化 */
  isAdmin?: boolean
  /** 会員の相性履歴（最大10件） */
  historyItems?: CompatHistoryItem[]
}

// 表示順とラベル（データキー→表示名）
const CATS: { key: SynCategory; label: string }[] = [
  { key: '恋愛', label: '恋愛' },
  { key: '夫婦家庭', label: '結婚・家庭' },
  { key: '友人', label: '友人' },
  { key: '仕事', label: '仕事' },
]

const CITIES = Object.keys(CITY_COORDS)

export function SynastryTab({
  selfBirthday,
  selfBirthTime,
  selfBirthCity,
  people,
  preselectId,
  isAdmin,
  historyItems,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [city, setCity] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<SynResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [personIdx, setPersonIdx] = useState('')
  // 会員のみ: サブタブ（相性を占う／履歴）
  const isMember = !isAdmin
  const [subtab, setSubtab] = useState<'compute' | 'history'>('compute')

  const self = { birthday: selfBirthday, birthTime: selfBirthTime, birthCity: selfBirthCity }

  async function compute(partner: { birthday: string; birthTime: string | null; birthCity: string | null }) {
    setError(null)
    setPending(true)
    try {
      setResult(await runSynastry(self, partner))
      return true
    } catch {
      setError('計算中にエラーが発生しました')
      return false
    } finally {
      setPending(false)
    }
  }

  const pickByIndex = (idx: number) => {
    if (!people || !people[idx]) return
    const p = people[idx]
    setPersonIdx(String(idx))
    setSelectedName(p.name)
    compute({ birthday: p.birthday, birthTime: p.birthTime, birthCity: p.birthCity })
  }

  // 履歴一覧から遷移してきた場合、対象の人を自動選択して計算する（初回のみ）
  const didPreselect = useRef(false)
  useEffect(() => {
    if (didPreselect.current || !preselectId || !people) return
    const idx = people.findIndex((p) => p.id === preselectId)
    if (idx >= 0) {
      didPreselect.current = true
      pickByIndex(idx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectId, people])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) {
      setError('相手の生年月日を入力してください')
      return
    }
    if (isMember && !name.trim()) {
      setError('お相手の名前を入力してください')
      return
    }
    setSelectedName(null)
    setPersonIdx('')
    const ok = await compute({ birthday: date, birthTime: time || null, birthCity: city || null })
    // 会員は履歴に自動保存（最大10件）
    if (ok && isMember && name.trim()) {
      await saveCompatHistory({ name: name.trim(), birthday: date, birthTime: time || null, birthCity: city || null })
      router.refresh()
    }
  }

  // 履歴の相手をフォームに反映して再計算（保存はしない＝並び順を保つ）
  function viewHistory(it: CompatHistoryItem) {
    setName(it.name)
    setDate(it.birthday)
    setTime(it.birthTime ?? '')
    setCity(it.birthCity ?? '')
    setSelectedName(null)
    setPersonIdx('')
    setSubtab('compute')
    compute({ birthday: it.birthday, birthTime: it.birthTime, birthCity: it.birthCity })
  }

  async function removeHistory(id: string, nm: string) {
    if (!confirm(`「${nm}」との相性履歴を削除しますか？`)) return
    await deleteCompatHistory(id)
    router.refresh()
  }

  function onPickPerson(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = e.target.value
    if (idx === '' || !people) {
      setPersonIdx('')
      setSelectedName(null)
      return
    }
    pickByIndex(Number(idx))
  }

  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)' }}
    >
      <div className="rounded-[15px] overflow-hidden" style={{ background: 'rgba(9, 9, 25, 0.98)' }}>
        <div className="p-6 space-y-5">
          {/* ヘッダー */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-pink-500" />
            <p className="text-xs text-pink-400 font-medium tracking-widest">相性（2人のシナストリー）</p>
          </div>

          {/* 会員: サブタブ（相性を占う／履歴） */}
          {isMember && (
            <div className="flex rounded-lg p-1 gap-1" style={{ background: 'rgba(20,16,40,0.8)' }}>
              {([
                { key: 'compute', label: '相性を占う' },
                { key: 'history', label: `履歴${historyItems && historyItems.length ? `（${historyItems.length}）` : ''}` },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSubtab(t.key)}
                  className={[
                    'flex-1 py-2 text-xs rounded-md transition-colors',
                    subtab === t.key
                      ? 'text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-300 font-medium',
                  ].join(' ')}
                  style={
                    subtab === t.key
                      ? { background: 'rgba(236,72,153,0.10)', boxShadow: 'inset 0 0 0 1px rgba(236,72,153,0.35)' }
                      : undefined
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* 会員: 履歴タブ */}
          {isMember && subtab === 'history' && (
            <CompatHistoryList items={historyItems ?? []} onView={viewHistory} onDelete={removeHistory} />
          )}

          {/* 管理者: 登録済みの人から選ぶ */}
          {(!isMember || subtab === 'compute') && people && people.length > 0 && (
            <div className="rounded-xl border border-indigo-800/40 p-4" style={{ background: 'rgba(20,16,40,0.6)' }}>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                登録済みの人から選ぶ（管理者）
                <select
                  onChange={onPickPerson}
                  value={personIdx}
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">選択…</option>
                  {people.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
              </label>
              {selectedName && (
                <p className="text-[11px] text-indigo-300 mt-2">選択中のお相手：{selectedName}</p>
              )}
              <p className="text-[10px] text-slate-500 mt-2">または下記に直接入力もできます。</p>
            </div>
          )}

          {/* 相手の入力フォーム（会員は履歴タブのとき非表示） */}
          {(!isMember || subtab === 'compute') && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-pink-900/30 p-4" style={{ background: 'rgba(20,16,40,0.6)' }}>
            <p className="text-sm text-slate-300 font-medium">お相手の情報（手入力）</p>
            {isMember && (
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                お相手の名前
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: たろう"
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-pink-500"
                />
              </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                生年月日
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-pink-500"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                出生時刻（任意）
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-pink-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                都市（任意）
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-pink-500"
                >
                  <option value="">未選択</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-[10px] text-slate-500">※ 月・ASC・MC は出生時刻＋都市の両方が必要です。どちらかが無い側の月・ASC は相性計算から除外されます。</p>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #db2777, #7c3aed)' }}
            >
              {pending ? '計算中…' : '相性を見る'}
            </button>
            {isMember && <p className="text-[10px] text-slate-500">相性を見ると履歴に自動保存されます（最大10件）。</p>}
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </form>
          )}

          {/* 結果（会員は履歴タブのとき非表示） */}
          {(!isMember || subtab === 'compute') && result && <SynResultView result={result} />}
        </div>
      </div>
    </div>
  )
}

function CompatHistoryList({
  items,
  onView,
  onDelete,
}: {
  items: CompatHistoryItem[]
  onView: (it: CompatHistoryItem) => void
  onDelete: (id: string, name: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/40 p-6 text-center" style={{ background: 'rgba(20,16,40,0.6)' }}>
        <p className="text-sm text-slate-400">まだ相性履歴がありません</p>
        <p className="text-xs text-slate-600 mt-1">「相性を占う」から占うと、ここに残ります（最大10件）。</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-xl border border-pink-900/30 p-3 flex items-center justify-between gap-2"
          style={{ background: 'rgba(20,16,40,0.6)' }}
        >
          <button type="button" onClick={() => onView(it)} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">{it.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{it.birthdayLabel}</p>
          </button>
          <button
            type="button"
            onClick={() => onView(it)}
            className="shrink-0 flex items-stretch gap-1.5 px-1.5 py-1 rounded-lg hover:bg-pink-500/10 transition-colors"
            title="この相性を見る"
          >
            <HistScore label="総合" value={it.total} color="text-pink-300" />
            <div className="w-px bg-slate-700/50" />
            <HistScore label="恋愛" value={it.love} color="text-rose-300" />
            <div className="w-px bg-slate-700/50" />
            <HistScore label="仕事" value={it.work} color="text-sky-300" />
            <div className="w-px bg-slate-700/50" />
            <HistScore label="友人" value={it.friend} color="text-emerald-300" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(it.id, it.name)}
            aria-label="削除"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function HistScore({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className="text-center px-0.5">
      <p className={`text-[8px] ${color} leading-none`} style={{ opacity: 0.8 }}>{label}</p>
      <p className={`text-sm font-bold ${color} leading-tight`}>
        {value === null ? '—' : value}
      </p>
    </div>
  )
}

function SynResultView({ result }: { result: SynResult }) {
  const { total, categories, aspects } = result

  if (total === null) {
    return (
      <div className="rounded-xl border border-slate-700/50 p-5 text-center">
        <p className="text-slate-300 text-sm">評価対象のアスペクトが見つかりませんでした。</p>
        <p className="text-slate-500 text-xs mt-1">強い縁は薄めの組み合わせです。</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 総合点 */}
      <div className="rounded-xl border border-pink-500/30 py-5 text-center" style={{ background: 'rgba(236,72,153,0.08)' }}>
        <p className="text-xs text-pink-300/80 tracking-widest mb-1">総合点</p>
        <p className="text-4xl font-bold text-white">{total}<span className="text-lg text-slate-400 ml-1">点</span></p>
      </div>

      {/* カテゴリ別点数 */}
      <div className="grid grid-cols-4 gap-2">
        {CATS.map(({ key, label }) => (
          <div key={key} className="rounded-lg py-2.5 text-center border border-slate-700/40" style={{ background: 'rgba(20,16,40,0.6)' }}>
            <p className="text-[10px] text-slate-400 leading-tight">{label}</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {categories[key] === null ? '—' : categories[key]}
              {categories[key] !== null && <span className="text-[10px] text-slate-500 ml-0.5">点</span>}
            </p>
          </div>
        ))}
      </div>

      {/* カテゴリ別コメント（重み5・3のみ／そのカテゴリの説明があるものだけ） */}
      {CATS.map(({ key, label }) => {
        const list = aspects.filter((a) => a.weight >= 3 && a.comment[key])
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 rounded-full bg-pink-500" />
              <p className="text-sm font-bold text-white">{label}</p>
              <span className="text-[10px] text-slate-500">{categories[key] === null ? '—' : `${categories[key]}点`}</span>
            </div>
            {list.length ? (
              <ul className="space-y-2">
                {list.map((a, i) => (
                  <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start">
                    <span className="text-pink-500 mr-2 mt-0.5 shrink-0">•</span>
                    <span>
                      <span className="text-slate-500 block mb-1">［あなたの{a.selfJP} × お相手の{a.partnerJP} {a.angle}°］</span>
                      {a.comment[key]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600">主要なアスペクトはありません。</p>
            )}
          </div>
        )
      })}

      {/* アスペクト一覧 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 rounded-full bg-slate-500" />
          <p className="text-sm font-bold text-white">アスペクト一覧</p>
        </div>
        <ul className="space-y-1">
          {aspects.map((a, i) => (
            <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
              <span className={`inline-block w-8 text-center rounded text-[10px] py-0.5 ${
                a.weight === 5 ? 'bg-pink-900/50 text-pink-300' : a.weight === 3 ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-800 text-slate-500'
              }`}>{a.group}</span>
              あなたの{a.selfJP} × お相手の{a.partnerJP}　{a.angle}°　オーブ{a.orb}°
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
