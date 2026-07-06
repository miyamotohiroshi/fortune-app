'use client'

import { useState, useRef, useEffect } from 'react'
import type { DirectionAspectResult } from '@/src/lib/astrology/directions'
import { DIRECTION_IMPORTANCE_THRESHOLD } from '@/src/lib/astrology/directions'
import type { DirectionMaster } from '@/src/data/direction-master'
import { DIRECTION_MASTER_MAP } from '@/src/data/direction-master'
import { ASPECT_NAMES_JA } from '@/src/lib/astrology/constants'
import type { AspectType } from '@/src/lib/astrology/constants'
import { computeYearFortune, TSUHENSEI, JUNI_UN, type YearFortune } from '@/src/lib/meishikiCalc'

type Props = {
  aspects: DirectionAspectResult[]
  startYear: number
  endYear: number
  currentYear: number
  birthday: string // ISO string
  dayStem: number | null
  dayBranch: number | null
}

const PLANET_SHORT: Record<string, string> = {
  sun: '太', moon: '月', mercury: '水', venus: '金', mars: '火',
  jupiter: '木', saturn: '土', uranus: '天', neptune: '海', pluto: '冥',
  asc: 'ASC', mc: 'MC', desc: 'DESC',
}

const CATEGORIES = ['チャンス', '転機', '試練'] as const
type Category = (typeof CATEGORIES)[number]

type SelectedAspect = {
  result: DirectionAspectResult
  master: DirectionMaster
}

function YearColumn({
  year,
  age,
  aspectsByCategory,
  onSelect,
  selectedKey,
  isCurrentYear,
  fortune,
}: {
  year: number
  age: number
  aspectsByCategory: Record<Category, DirectionAspectResult[]>
  onSelect: (r: DirectionAspectResult, m: DirectionMaster) => void
  selectedKey: string | null
  isCurrentYear: boolean
  fortune: YearFortune | null
}) {
  return (
    <div className={[
      'flex-shrink-0 w-25 border-r border-slate-800/50',
      isCurrentYear ? 'bg-purple-950/40' : '',
    ].join(' ')}>
      {/* Year header */}
      <div className={[
        'h-[52px] flex flex-col items-center justify-center border-b px-1',
        isCurrentYear ? 'border-purple-700/50' : 'border-slate-700/50',
      ].join(' ')}>
        <span className={`text-xs font-bold ${isCurrentYear ? 'text-purple-300' : 'text-slate-200'}`}>{year}</span>
        <span className={`text-[10px] ${isCurrentYear ? 'text-purple-400/70' : 'text-slate-500'}`}>{age}才</span>
      </div>

      {/* 四柱推命 年運（年運星＋十二運、天中殺はハイライト） */}
      <div className={[
        'h-[52px] flex flex-col items-center justify-center border-b px-1 leading-none',
        fortune?.isKubou ? 'bg-rose-950/40 border-rose-800/40' : 'border-slate-700/40',
      ].join(' ')}>
        {fortune ? (
          <>
            <span className="text-xs font-bold text-amber-200/90">{TSUHENSEI[fortune.tsuhen]}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{JUNI_UN[fortune.juniUn]}</span>
            {fortune.isKubou && (
              <span className="text-[8px] font-semibold text-rose-300 mt-0.5">天中殺</span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-slate-600">—</span>
        )}
      </div>

      {/* 3 rows */}
      {CATEGORIES.map((cat) => {
        const items = aspectsByCategory[cat] ?? []
        return (
          <div key={cat} className="h-[80px] border-b border-slate-800/40 p-1 overflow-y-auto">
            {items.map((asp, idx) => {
              const key = `${asp.year}-${asp.directedPlanet}-${asp.natalPlanet}-${asp.aspectType}`
              const master = DIRECTION_MASTER_MAP.get(asp.masterKey)
              const icon = master?.mainIcon ?? ''
              const isSelected = selectedKey === key
              return (
                <button
                  key={idx}
                  onClick={() => master && onSelect(asp, master)}
                  className={[
                    'w-full text-left px-1 py-0.5 rounded text-[9px] leading-tight mb-0.5 transition-colors',
                    isSelected
                      ? 'bg-purple-700/60 text-white'
                      : 'hover:bg-slate-700/60 text-slate-300',
                  ].join(' ')}
                >
                  <span className="mr-0.5">{icon}</span>
                  <span>{PLANET_SHORT[asp.directedPlanet]}×{PLANET_SHORT[asp.natalPlanet]}</span>
                  <span className="text-slate-500 ml-0.5">{asp.aspectAngle}°</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function DetailCard({
  selected,
  onClose,
}: {
  selected: SelectedAspect
  onClose: () => void
}) {
  const { result, master } = selected
  const aspectLabel = ASPECT_NAMES_JA[result.aspectType as AspectType] ?? `${result.aspectAngle}°`

  return (
    <div className="rounded-2xl border border-slate-700/60 p-5 space-y-5" style={{ background: 'rgba(20,20,40,0.95)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-bold text-white">{master.aspect}</p>
          <p className="text-xs text-slate-400 mt-1">{aspectLabel}　重要度 {master.importance}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors shrink-0"
        >
          ×
        </button>
      </div>

      {/* Icons + themes（横並び・区切り線） */}
      <div className="flex items-center text-sm">
        <div className="flex items-center gap-2 text-slate-200 flex-1">
          <span className="text-lg">{master.mainIcon}</span>
          <span>{master.mainTheme}</span>
        </div>
        <div className="w-px h-4 bg-slate-600 shrink-0 mx-3" />
        <div className="flex items-center gap-2 text-slate-400 flex-1">
          <span className="text-lg">{master.subIcon}</span>
          <span>{master.subTheme}</span>
        </div>
      </div>

      {/* Title（パープル左ボーダー） */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-purple-500 shrink-0" />
        <p className="text-base font-bold text-white">{master.title}</p>
      </div>

      {/* Summary */}
      <p className="text-sm font-medium text-slate-200 leading-relaxed">{master.summary}</p>

      {/* Detail */}
      <p className="text-xs text-slate-400 leading-relaxed">{master.detail}</p>

      {/* likelyEvents */}
      {master.likelyEvents.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest">起こりやすい出来事</p>
          <ul className="space-y-0.5">
            {master.likelyEvents.map((ev, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-1">
                <span className="text-sky-400 mt-0.5 shrink-0">・</span>
                <span>{ev.replace(/^・/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* affectedAreas */}
      {master.affectedAreas && Object.keys(master.affectedAreas).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest">影響を受けやすい分野</p>
          <div className="space-y-1">
            {(() => {
              const areaEntries = Object.entries(master.affectedAreas!)
              const maxScore = Math.max(...areaEntries.map(([, v]) => v))
              const scale = maxScore > 5 ? maxScore : 5
              return areaEntries.map(([area, score]) => {
                const filled = Math.min(5, Math.round((score / scale) * 5))
                return (
                  <div key={area} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-14 shrink-0">{area}</span>
                    <span className="text-xs tracking-wider">
                      {'■'.repeat(filled)}{'□'.repeat(5 - filled)}
                    </span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* howToSpend */}
      {master.howToSpend && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest">この時期の過ごし方</p>
          <p className="text-xs text-slate-300 leading-relaxed">{master.howToSpend}</p>
        </div>
      )}

      {/* afterOvercoming */}
      {master.afterOvercoming && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest">乗り越えた先</p>
          <p className="text-xs text-emerald-300 leading-relaxed">{master.afterOvercoming}</p>
        </div>
      )}

      {/* Tags */}
      {master.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {master.tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-purple-200 border border-purple-700/50"
              style={{ background: 'rgba(88,28,135,0.3)' }}
            >
              {tag.label}
              <span className="text-purple-400 font-semibold">{tag.weight}</span>
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {master.actions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest">おすすめの行動</p>
          <ul className="space-y-0.5">
            {master.actions.map((a, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-1">
                <span className="text-purple-400 mt-0.5">・</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cautions */}
      {master.cautions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest">注意ポイント</p>
          <ul className="space-y-0.5">
            {master.cautions.map((c, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-1">
                <span className="text-amber-500 mt-0.5">・</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function DirectionLifeTab({ aspects, startYear, endYear, currentYear, birthday, dayStem, dayBranch }: Props) {
  const [selected, setSelected] = useState<SelectedAspect | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'important'>('important')
  const [orb, setOrb] = useState<number>(0.5)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Filter by importance threshold and orb
  const filtered = aspects.filter(a => {
    const master = DIRECTION_MASTER_MAP.get(a.masterKey)
    if (!master) return false
    if (a.orb > orb) return false
    if (filterMode === 'important') return master.importance >= DIRECTION_IMPORTANCE_THRESHOLD
    return true
  })

  // Group by year → category
  const yearMap = new Map<number, Record<Category, DirectionAspectResult[]>>()
  for (let y = startYear; y <= endYear; y++) {
    yearMap.set(y, { チャンス: [], 転機: [], 試練: [] })
  }
  const CATEGORY_FALLBACK: Record<string, Category> = { 変容: '転機' }
  for (const asp of filtered) {
    const master = DIRECTION_MASTER_MAP.get(asp.masterKey)
    if (!master) continue
    const rawCat = master.category as string
    const cat: Category = (CATEGORIES as readonly string[]).includes(rawCat)
      ? rawCat as Category
      : (CATEGORY_FALLBACK[rawCat] ?? '転機')
    const entry = yearMap.get(asp.year)
    if (!entry) continue
    entry[cat].push(asp)
  }

  // Sort within each category: importance DESC → displayOrder ASC
  for (const [, cats] of yearMap) {
    for (const cat of CATEGORIES) {
      cats[cat].sort((a, b) => {
        const ma = DIRECTION_MASTER_MAP.get(a.masterKey)!
        const mb = DIRECTION_MASTER_MAP.get(b.masterKey)!
        if (mb.importance !== ma.importance) return mb.importance - ma.importance
        return ma.displayOrder - mb.displayOrder
      })
    }
  }

  // Auto-scroll to center current year on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const idx = currentYear - startYear
    const colWidth = 100
    const containerWidth = scrollRef.current.clientWidth
    scrollRef.current.scrollLeft = Math.max(0, idx * colWidth - containerWidth / 2 + colWidth / 2)
  }, [currentYear, startYear])

  const selectedKey = selected
    ? `${selected.result.year}-${selected.result.directedPlanet}-${selected.result.natalPlanet}-${selected.result.aspectType}`
    : null

  function handleSelect(r: DirectionAspectResult, m: DirectionMaster) {
    const key = `${r.year}-${r.directedPlanet}-${r.natalPlanet}-${r.aspectType}`
    if (selectedKey === key) {
      setSelected(null)
    } else {
      setSelected({ result: r, master: m })
    }
  }

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  const birthYear = new Date(birthday).getFullYear()

  return (
    <div className="space-y-4">
      {/* Filter selects */}
      <div className="flex justify-end items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span>表示レベル：</span>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value as 'all' | 'important')}
            className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="important">重要のみ</option>
            <option value="all">すべて</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span>オーブ：</span>
          <select
            value={orb}
            onChange={e => setOrb(Number(e.target.value))}
            className="bg-slate-800/60 border border-slate-700/60 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value={0.5}>0.5°</option>
            <option value={1.0}>1.0°</option>
          </select>
        </label>
      </div>

      {/* 四柱推命の運勢行の凡例 */}
      <p className="text-[10px] text-slate-500 leading-relaxed">
        <span className="text-amber-200/90">年運星</span>＝その年のテーマ（通変星）／
        <span className="text-slate-300">十二運</span>＝その年の勢い／
        <span className="text-rose-300">赤・天中殺</span>＝運気の変わり目・無理を控えたい年
      </p>

      {/* Legend row labels */}
      <div className="flex gap-2" style={{ background: 'rgba(9,9,25,0.6)' }}>
        <div className="flex-shrink-0 w-10 rounded-xl border border-slate-800/40 overflow-hidden">
          <div className="h-[52px] border-b border-slate-700/30" />
          <div className="h-[52px] border-b border-slate-800/40 flex items-center justify-center">
            <span className="text-[9px] font-semibold tracking-wider text-amber-300/80" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              運勢
            </span>
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="h-[80px] border-b border-slate-800/40 flex items-center justify-center">
              <span className={[
                'text-[9px] font-semibold tracking-wider writing-mode-vertical',
                cat === 'チャンス' ? 'text-emerald-400' :
                cat === '転機' ? 'text-sky-400' : 'text-rose-400',
              ].join(' ')} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                {cat}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline scroll area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto rounded-xl border border-slate-800/40"
          style={{ background: 'rgba(9,9,25,0.8)' }}
        >
          <div className="flex" style={{ minWidth: `${years.length * 100}px` }}>
            {years.map((year) => {
              const age = year - birthYear
              const cats = yearMap.get(year) ?? { チャンス: [], 転機: [], 試練: [] }
              const fortune =
                dayStem !== null && dayBranch !== null
                  ? computeYearFortune(dayStem, dayBranch, year)
                  : null
              return (
                <YearColumn
                  key={year}
                  year={year}
                  age={age}
                  aspectsByCategory={cats}
                  onSelect={handleSelect}
                  selectedKey={selectedKey}
                  isCurrentYear={year === currentYear}
                  fortune={fortune}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail card */}
      {selected && (
        <DetailCard selected={selected} onClose={() => setSelected(null)} />
      )}

      {filtered.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">
          重要度{DIRECTION_IMPORTANCE_THRESHOLD}以上のダイレクションアスペクトは見つかりませんでした
        </p>
      )}
    </div>
  )
}
