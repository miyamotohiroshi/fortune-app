'use client'

import { useState, useRef, useEffect } from 'react'
import type { DirectionAspectResult } from '@/src/lib/astrology/directions'
import { DIRECTION_IMPORTANCE_THRESHOLD } from '@/src/lib/astrology/directions'
import type { DirectionMaster } from '@/src/data/direction-master'
import { DIRECTION_MASTER_MAP } from '@/src/data/direction-master'
import type { DirectionTriggerWindow } from '@/src/lib/astrology/direction-aspect-triggers'
import { DIRECTION_TRIGGER_PATTERNS } from '@/src/data/direction-trigger-patterns'
import type { DirectionTriggerPattern } from '@/src/data/direction-trigger-patterns'
import { TRIGGER_POLARITY_STYLE } from '@/src/lib/astrology/trigger-polarity'
import type { TriggerPolarity } from '@/src/lib/astrology/trigger-polarity'
import { ASPECT_NAMES_JA } from '@/src/lib/astrology/constants'
import type { AspectType } from '@/src/lib/astrology/constants'
import { computeYearFortune, branchRelations, STEMS, BRANCHES, TSUHENSEI, JUNI_UN, type YearFortune, type BranchRelation } from '@/src/lib/meishikiCalc'
import { NENUN_COMMON, NENUN_BY_GENMEI, NENUN_JUNIUN } from '@/src/data/nenun-master'
import { AISHO_TEXT, aishoVerdict } from '@/src/data/aisho-master'

// 相性トーン → 配色
const AISHO_TONE_STYLE: Record<string, { color: string; bg: string }> = {
  good: { color: '#6ee7b7', bg: 'rgba(16,185,129,0.14)' },
  bad: { color: '#fca5a5', bg: 'rgba(244,63,94,0.14)' },
  mixed: { color: '#fcd34d', bg: 'rgba(245,158,11,0.14)' },
  none: { color: '#94a3b8', bg: 'transparent' },
}

// 天剋地冲（冲より一段強い凶意）用の配色
const TENKOKU_STYLE = { color: '#fecdd3', bg: 'rgba(225,29,72,0.35)' }

type Props = {
  aspects: DirectionAspectResult[]
  directionTriggerWindows: DirectionTriggerWindow[]
  startYear: number
  endYear: number
  currentYear: number
  birthday: string // ISO string
  dayStem: number | null
  dayBranch: number | null
  monthBranch: number | null
  genmei: number | null // 元命（通変星ID 1-10）
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
  onSelectFortune,
  isFortuneSelected,
  aisho,
  onSelectAisho,
  isAishoSelected,
  onSelectTentoku,
  isTentokuSelected,
  triggerPolarityByKey,
}: {
  year: number
  age: number
  aspectsByCategory: Record<Category, DirectionAspectResult[]>
  onSelect: (r: DirectionAspectResult, m: DirectionMaster) => void
  selectedKey: string | null
  isCurrentYear: boolean
  fortune: YearFortune | null
  onSelectFortune: (year: number) => void
  isFortuneSelected: boolean
  aisho: BranchRelation[] | null
  onSelectAisho: (year: number) => void
  isAishoSelected: boolean
  onSelectTentoku: (year: number) => void
  isTentokuSelected: boolean
  triggerPolarityByKey: Map<string, TriggerPolarity>
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

      {/* 四柱推命 年運（クリックで解説。年運星＋十二運、天中殺はハイライト） */}
      <div className={[
        'h-[52px] border-b',
        fortune?.isKubou ? 'border-rose-800/40' : 'border-slate-700/40',
      ].join(' ')}>
        {fortune ? (
          <button
            type="button"
            onClick={() => onSelectFortune(year)}
            aria-expanded={isFortuneSelected}
            className={[
              'w-full h-full flex flex-col items-center justify-center px-1 leading-none transition-colors',
              fortune.isKubou ? 'bg-rose-950/40' : '',
              isFortuneSelected ? 'ring-1 ring-inset ring-amber-400/60 bg-amber-500/10' : 'hover:bg-amber-500/10',
            ].join(' ')}
          >
            <span className="text-xs font-bold text-amber-200/90 underline decoration-dotted decoration-amber-400/40 underline-offset-2">{TSUHENSEI[fortune.tsuhen]}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{JUNI_UN[fortune.juniUn]}</span>
            {fortune.isKubou && (
              <span className="text-[8px] font-semibold text-rose-300 mt-0.5">天中殺</span>
            )}
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-slate-600">—</span>
          </div>
        )}
      </div>

      {/* 地支相性（日支×年支。クリックで解説）。天剋地冲の年は特に強い凶意として表示を上書き */}
      <div className="h-[52px] border-b border-slate-700/40">
        {aisho ? (() => {
          const isChichu = fortune?.isTenkokuChichu ?? false
          const v = aishoVerdict(aisho)
          const s = isChichu ? TENKOKU_STYLE : AISHO_TONE_STYLE[v.tone]
          const label = isChichu ? '天剋地冲' : v.label
          return (
            <button
              type="button"
              onClick={() => onSelectAisho(year)}
              aria-expanded={isAishoSelected}
              className={[
                'w-full h-full flex flex-col items-center justify-center px-1 leading-none transition-colors',
                isAishoSelected ? 'ring-1 ring-inset ring-slate-300/50 bg-white/5' : 'hover:bg-white/5',
              ].join(' ')}
            >
              <span className="text-[11px] font-bold" style={{ color: s.color }}>
                {aisho.length ? aisho.join('・') : '—'}
              </span>
              <span
                className="text-[9px] font-semibold mt-0.5 px-1 rounded"
                style={{ color: s.color, backgroundColor: s.bg }}
              >
                {label}
              </span>
            </button>
          )
        })() : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-slate-600">—</span>
          </div>
        )}
      </div>

      {/* 天徳貴人・天徳合（月支から決まる守護の干支と、その年の干支が一致するか。クリックで解説） */}
      <div className="h-[52px] border-b border-slate-700/40">
        {fortune ? (() => {
          const { tentoku } = fortune
          const hit = tentoku.hasKijin ? '天徳貴人' : tentoku.hasGou ? '天徳合' : null
          return (
            <button
              type="button"
              onClick={() => onSelectTentoku(year)}
              aria-expanded={isTentokuSelected}
              className={[
                'w-full h-full flex flex-col items-center justify-center px-1 leading-none transition-colors',
                isTentokuSelected ? 'ring-1 ring-inset ring-sky-300/50 bg-white/5' : 'hover:bg-white/5',
              ].join(' ')}
            >
              {hit ? (
                <>
                  <span className="text-sm">🛡️</span>
                  <span className="text-[9px] font-semibold mt-0.5 px-1 rounded text-sky-200" style={{ backgroundColor: 'rgba(56,189,248,0.14)' }}>
                    {hit}
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-slate-600">—</span>
              )}
            </button>
          )
        })() : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-slate-600">—</span>
          </div>
        )}
      </div>

      {/* 3 rows */}
      {CATEGORIES.map((cat) => {
        const items = aspectsByCategory[cat] ?? []
        return (
          <div key={cat} className="h-[80px] border-b border-slate-800/40 p-1 overflow-y-auto scrollbar-hide">
            {items.map((asp, idx) => {
              const key = `${asp.year}-${asp.directedPlanet}-${asp.natalPlanet}-${asp.aspectType}`
              const master = DIRECTION_MASTER_MAP.get(asp.masterKey)
              const icon = master?.mainIcon ?? ''
              const isSelected = selectedKey === key
              const triggerPolarity = triggerPolarityByKey.get(`${asp.year}-${asp.directedPlanet}-${asp.natalPlanet}`)
              const triggerStyle = triggerPolarity ? TRIGGER_POLARITY_STYLE[triggerPolarity] : null
              return (
                <button
                  key={idx}
                  onClick={() => master && onSelect(asp, master)}
                  className={[
                    'w-full text-left px-1 py-0.5 rounded text-[9px] leading-tight mb-0.5 transition-colors',
                    isSelected
                      ? 'bg-purple-700/60 text-white'
                      : triggerStyle
                        ? `ring-1 ring-inset ${triggerStyle.ring} hover:brightness-125 text-slate-200`
                        : 'hover:bg-slate-700/60 text-slate-300',
                  ].join(' ')}
                  style={triggerStyle && !isSelected ? { background: triggerStyle.bg } : undefined}
                >
                  {triggerStyle && <span className="mr-0.5">{triggerStyle.icon}</span>}
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
  triggers,
}: {
  selected: SelectedAspect
  onClose: () => void
  triggers: { window: DirectionTriggerWindow; pattern: DirectionTriggerPattern }[]
}) {
  const { result, master } = selected
  const aspectLabel = ASPECT_NAMES_JA[result.aspectType as AspectType] ?? `${result.aspectAngle}°`

  return (
    <div className="rounded-2xl border border-slate-700/60 p-5 space-y-5" style={{ background: 'rgba(20,20,40,0.95)' }}>
      {/* トランシット発動期間（進行×トランシットの重なり）。同じパターンが複数回発動する場合は1枚にまとめる */}
      {(() => {
        const grouped = new Map<string, { window: DirectionTriggerWindow; pattern: DirectionTriggerPattern }[]>()
        for (const t of triggers) {
          const arr = grouped.get(t.pattern.id) ?? []
          arr.push(t)
          grouped.set(t.pattern.id, arr)
        }
        return [...grouped.entries()].map(([patternId, group]) => {
          const { pattern } = group[0]
          const style = TRIGGER_POLARITY_STYLE[pattern.polarity]
          return (
            <div
              key={patternId}
              className={`rounded-xl border ${style.border} px-3.5 py-3`}
              style={{ background: style.bg }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs">{style.icon}</span>
                <span className={`text-[11px] font-bold ${style.text}`}>{pattern.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{pattern.description}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                {group.map(({ window }, i) => (
                  <span key={i} className={`text-[11px] opacity-80 ${style.text}`}>
                    {window.startDate.slice(5).replace('-', '/')}〜{window.endDate.slice(5).replace('-', '/')}
                  </span>
                ))}
              </div>
            </div>
          )
        })
      })()}

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

export function DirectionLifeTab({ aspects, directionTriggerWindows, startYear, endYear, currentYear, birthday, dayStem, dayBranch, monthBranch, genmei }: Props) {
  const [selected, setSelected] = useState<SelectedAspect | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'important'>('important')
  const [orb, setOrb] = useState<number>(0.5)
  const [nenunYear, setNenunYear] = useState<number | null>(null)
  const [aishoYear, setAishoYear] = useState<number | null>(null)
  const [tentokuYear, setTentokuYear] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const toggleNenun = (year: number) => setNenunYear((cur) => (cur === year ? null : year))
  const toggleAisho = (year: number) => setAishoYear((cur) => (cur === year ? null : year))
  const toggleTentoku = (year: number) => setTentokuYear((cur) => (cur === year ? null : year))

  // ダイレクション発動年×トランシット重なりのルックアップ（年-進行天体-出生天体をキーに）
  const triggerLookup = new Map<string, { window: DirectionTriggerWindow; pattern: DirectionTriggerPattern }[]>()
  for (const window of directionTriggerWindows) {
    const pattern = DIRECTION_TRIGGER_PATTERNS.find(p => p.id === window.patternId)
    if (!pattern) continue
    const key = `${window.directionYear}-${pattern.directedPlanet}-${pattern.natalPlanet}`
    const arr = triggerLookup.get(key) ?? []
    arr.push({ window, pattern })
    triggerLookup.set(key, arr)
  }
  const triggerPolarityByKey = new Map<string, TriggerPolarity>()
  for (const [key, arr] of triggerLookup) {
    triggerPolarityByKey.set(key, arr[0].pattern.polarity)
  }

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
        <span className="text-rose-300">赤・天中殺</span>＝運気の変わり目・無理を控えたい年<br />
        <span className="text-slate-300">相性</span>＝あなたの日支とその年の相性：
        <span className="text-emerald-300">支合・三合＝良い運</span> ／
        <span className="text-rose-300">冲・刑・害・破＝注意</span>（
        <span style={{ color: TENKOKU_STYLE.color }}>天剋地冲＝特に強い凶意</span>）<br />
        <span className="text-sky-300/90">天徳</span>＝あなたの月支から決まる守護の干支と、その年の干支が一致するか（
        <span className="text-sky-300">天徳貴人・天徳合＝吉神</span>）
      </p>

      {/* Legend row labels */}
      <div className="flex gap-2" style={{ background: 'rgba(9,9,25,0.6)' }}>
        <div className="flex-shrink-0 w-10 rounded-xl border border-slate-800/40 overflow-hidden">
          <div className="h-[52px] border-b border-slate-700/30" />
          <div className="h-[52px] border-b border-slate-800/40 flex items-center justify-center">
            <span className="text-[9px] font-semibold tracking-wider text-amber-300/80" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              年運勢
            </span>
          </div>
          <div className="h-[52px] border-b border-slate-800/40 flex items-center justify-center">
            <span className="text-[9px] font-semibold tracking-wider text-slate-300/80" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              相性
            </span>
          </div>
          <div className="h-[52px] border-b border-slate-800/40 flex items-center justify-center">
            <span className="text-[9px] font-semibold tracking-wider text-sky-300/80" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              天徳
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
                dayStem !== null && dayBranch !== null && monthBranch !== null
                  ? computeYearFortune(dayStem, dayBranch, year, monthBranch)
                  : null
              const aisho =
                dayBranch !== null && fortune ? branchRelations(dayBranch, fortune.branch) : null
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
                  onSelectFortune={toggleNenun}
                  isFortuneSelected={nenunYear === year}
                  aisho={aisho}
                  onSelectAisho={toggleAisho}
                  isAishoSelected={aishoYear === year}
                  onSelectTentoku={toggleTentoku}
                  isTentokuSelected={tentokuYear === year}
                  triggerPolarityByKey={triggerPolarityByKey}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* 四柱推命 年運の解説パネル（運勢セルのクリックで開閉） */}
      {nenunYear !== null && dayStem !== null && dayBranch !== null && monthBranch !== null && (() => {
        const f = computeYearFortune(dayStem, dayBranch, nenunYear, monthBranch)
        const nenunName = TSUHENSEI[f.tsuhen]
        const genmeiName = genmei ? TSUHENSEI[genmei] : null
        const common = NENUN_COMMON[nenunName]
        const personal = genmeiName ? NENUN_BY_GENMEI[genmeiName]?.[nenunName] : null
        return (
          <div className="rounded-2xl border border-amber-500/25 p-5 space-y-4" style={{ background: 'rgba(24,20,40,0.95)' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-white">
                  {nenunYear}年（{nenunYear - birthYear}才）の運勢
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  年運星
                  <span className="text-amber-200 font-medium mx-1">{nenunName}</span>
                  ／十二運 <span className="text-slate-300">{JUNI_UN[f.juniUn]}</span>
                  {f.isKubou && <span className="text-rose-300 font-medium ml-1">／天中殺</span>}
                </p>
              </div>
              <button
                onClick={() => setNenunYear(null)}
                className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors shrink-0"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div>
              <p className="text-[11px] text-amber-300/80 tracking-wider mb-1.5">この年のテーマ（{nenunName}の年）</p>
              <p className="text-sm text-slate-300 leading-relaxed">{common}</p>
            </div>

            {personal && (
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(245,158,11,0.06)' }}>
                <p className="text-[11px] text-amber-300/80 tracking-wider mb-1.5">
                  あなた（元命「{genmeiName}」）の場合
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">{personal}</p>
              </div>
            )}

            <div>
              <p className="text-[11px] text-amber-300/80 tracking-wider mb-1.5">
                その年の勢い（十二運「{JUNI_UN[f.juniUn]}」）
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{NENUN_JUNIUN[JUNI_UN[f.juniUn]]}</p>
            </div>

            {f.isKubou && (
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                ※ この年は天中殺（空亡）にあたります。運気の変わり目で、新規の大きな決断や無理な勝負は控えめにし、守りと充電を意識すると穏やかに過ごせます。
              </p>
            )}
          </div>
        )
      })()}

      {/* 地支相性の解説パネル（相性セルのクリックで開閉） */}
      {aishoYear !== null && dayBranch !== null && monthBranch !== null && (() => {
        const f = computeYearFortune(dayStem ?? 0, dayBranch, aishoYear, monthBranch)
        const rels = branchRelations(dayBranch, f.branch)
        const v = aishoVerdict(rels)
        const s = AISHO_TONE_STYLE[v.tone]
        return (
          <div className="rounded-2xl border border-slate-600/40 p-5 space-y-4" style={{ background: 'rgba(20,20,40,0.95)' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-white">
                  {aishoYear}年（{aishoYear - birthYear}才）の相性
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  あなたの日支 × その年（{BRANCHES[f.branch]}年）：
                  <span className="font-medium ml-1" style={{ color: s.color }}>
                    {rels.length ? rels.join('・') : '特になし'}（{v.label}）
                  </span>
                </p>
              </div>
              <button
                onClick={() => setAishoYear(null)}
                className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors shrink-0"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {f.isTenkokuChichu && (
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(225,29,72,0.1)' }}>
                <p className="text-sm font-bold mb-1" style={{ color: TENKOKU_STYLE.color }}>
                  天剋地冲（特に強い凶意）
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  日柱とその年の干支が、天干は同じ陰陽で相剋、地支は冲となる「天と地の両方でぶつかる」組み合わせです。変化・衝突・トラブルが通常の冲よりも強く出やすい、注意が必要な年です。無理な決断は避け、変化を落ち着いて受け止めましょう。
                </p>
              </div>
            )}

            {rels.length ? (
              <div className="space-y-3">
                {rels.map((r) => {
                  const info = AISHO_TEXT[r]
                  return (
                    <div key={r} className="rounded-xl p-3.5" style={{ background: info.good ? 'rgba(16,185,129,0.07)' : 'rgba(244,63,94,0.06)' }}>
                      <p className="text-sm font-bold mb-1" style={{ color: info.good ? '#6ee7b7' : '#fca5a5' }}>
                        {r}（{info.good ? '良い運' : '注意'}）— {info.short}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{info.desc}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">
                この年は、あなたの日支と特に強い相性（支合・三合・冲・刑・害・破）は結びません。良くも悪くも大きな相性の影響が少ない、穏やかな年といえます。
              </p>
            )}
          </div>
        )
      })()}

      {/* 天徳貴人・天徳合の解説パネル（天徳セルのクリックで開閉） */}
      {tentokuYear !== null && monthBranch !== null && (() => {
        const f = computeYearFortune(dayStem ?? 0, dayBranch ?? 0, tentokuYear, monthBranch)
        const { tentoku } = f
        const fmt = (v: { type: 'stem' | 'branch'; value: number }) =>
          v.type === 'stem' ? STEMS[v.value] : BRANCHES[v.value]
        const hit = tentoku.hasKijin ? '天徳貴人' : tentoku.hasGou ? '天徳合' : null
        return (
          <div className="rounded-2xl border border-sky-600/30 p-5 space-y-4" style={{ background: 'rgba(20,20,40,0.95)' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-white">
                  {tentokuYear}年（{tentokuYear - birthYear}才）の天徳
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  あなたの天徳貴人は「{fmt(tentoku.kijin)}」・天徳合は「{fmt(tentoku.gou)}」：
                  <span className="font-medium ml-1 text-sky-300">
                    {hit ?? '該当なし'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setTentokuYear(null)}
                className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors shrink-0"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              天徳貴人・天徳合は、あなたの月支から決まる「守護の干支」です。その年の干支がこの干支と一致すると、災いを軽減し、物事が穏やかに収まりやすいとされる吉神の年になります。
            </p>

            {hit ? (
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(56,189,248,0.08)' }}>
                <p className="text-sm font-bold mb-1 text-sky-300">
                  {hit}の年
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  この年は、あなたの天徳（守護の干支）とその年の干支が一致する、災いが軽くなりやすい年です。トラブルが起きても大事に至りにくく、周囲の助けを得やすいタイミングとされています。ただし油断せず、日頃の行いを大切にすることが吉を活かす鍵です。
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">
                この年は、天徳貴人・天徳合のどちらにも該当しません。特別な後押しはありませんが、悪い意味を持つものでもないので、他の運気を参考にしてください。
              </p>
            )}
          </div>
        )
      })()}

      {/* Detail card */}
      {selected && (
        <DetailCard
          selected={selected}
          onClose={() => setSelected(null)}
          triggers={triggerLookup.get(`${selected.result.year}-${selected.result.directedPlanet}-${selected.result.natalPlanet}`) ?? []}
        />
      )}

      {filtered.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">
          重要度{DIRECTION_IMPORTANCE_THRESHOLD}以上のダイレクションアスペクトは見つかりませんでした
        </p>
      )}
    </div>
  )
}
