'use client'

import { useState } from 'react'
import type { TransitBand, TransitPlanetKey } from '@/src/lib/astrology/transit'
import type { PairTriggerWindow } from '@/src/lib/astrology/pair-aspect-triggers'
import { PLANET_NAMES_JA, ASPECT_NAMES_JA, ASPECT_ANGLES } from '@/src/lib/astrology/constants'
import { TRANSIT_MASTER, aspectCategory } from '@/src/data/transit-master'
import { PAIR_TRIGGER_PATTERNS } from '@/src/data/pair-aspect-triggers'
import { TRIGGER_POLARITY_STYLE } from '@/src/lib/astrology/trigger-polarity'

type YearData = { year: number; bands: TransitBand[]; triggerWindows: PairTriggerWindow[] }

type Props = {
  years: YearData[]
  todayISO: string
}

// トランシット天体ごとの色（冥王星→木星）
const TRANSIT_COLORS: Record<TransitPlanetKey, { bar: string; dot: string; text: string }> = {
  pluto:   { bar: 'rgba(168,85,247,0.55)', dot: '#c084fc', text: 'text-purple-300' },
  neptune: { bar: 'rgba(56,189,248,0.5)',  dot: '#38bdf8', text: 'text-sky-300' },
  uranus:  { bar: 'rgba(45,212,191,0.5)',  dot: '#2dd4bf', text: 'text-teal-300' },
  saturn:  { bar: 'rgba(251,191,36,0.45)', dot: '#fbbf24', text: 'text-amber-300' },
  jupiter: { bar: 'rgba(74,222,128,0.45)', dot: '#4ade80', text: 'text-green-300' },
}

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// 特に重要な角度（合0°・矩90°・衝180°）は強調表示する
function isMajorAngle(angle: number): boolean {
  return angle === 0 || angle === 90 || angle === 180
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function dayOfYearFromISO(iso: string, year: number): number {
  const [y, m, d] = iso.split('-').map(Number)
  const start = Date.UTC(year, 0, 1)
  const cur = Date.UTC(y, m - 1, d)
  return Math.round((cur - start) / (24 * 60 * 60 * 1000)) // 0-based
}

function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}

const LABEL_W = 150

export function TransitTimeline({ years, todayISO }: Props) {
  const [yearIdx, setYearIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const { year, bands, triggerWindows } = years[yearIdx]
  const totalDays = isLeapYear(year) ? 366 : 365
  const todayYear = Number(todayISO.slice(0, 4))
  const showToday = year === todayYear
  const todayPct = showToday ? (dayOfYearFromISO(todayISO, year) / totalDays) * 100 : 0

  const switchYear = (idx: number) => {
    setYearIdx(idx)
    setSelected(null)
  }

  return (
    <div className="space-y-2">
      {/* 年の切替 */}
      <div className="flex gap-1">
        {years.map((y, i) => (
          <button
            key={y.year}
            type="button"
            onClick={() => switchYear(i)}
            className={[
              'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
              i === yearIdx
                ? 'bg-purple-600/40 text-purple-100 border border-purple-500/50'
                : 'text-slate-400 border border-slate-700/50 hover:text-slate-200',
            ].join(' ')}
          >
            {y.year}年
          </button>
        ))}
      </div>

      {/* 特別なチャンス期間（出生ペアアスペクト × トランシット発動） */}
      {triggerWindows.length > 0 && (
        <div className="space-y-2">
          {triggerWindows.map((tw, i) => {
            const pattern = PAIR_TRIGGER_PATTERNS.find(p => p.id === tw.patternId)
            if (!pattern) return null
            const style = TRIGGER_POLARITY_STYLE[pattern.polarity]
            return (
              <div
                key={i}
                className={`rounded-xl border ${style.border} p-3.5`}
                style={{ background: style.bg }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm">{style.icon}</span>
                  <span className={`text-xs font-bold ${style.text}`}>{pattern.title}</span>
                  <span className={`text-xs ml-auto opacity-80 ${style.text}`}>
                    {fmtDate(tw.startDate)} 〜 {fmtDate(tw.endDate)}（最接近 {fmtDate(tw.exactDate)}）
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{pattern.description}</p>
              </div>
            )
          })}
        </div>
      )}

      {bands.length === 0 ? (
        <div
          className="rounded-2xl border border-slate-800/40 p-5 text-center"
          style={{ background: 'rgba(9,9,25,0.6)' }}
        >
          <p className="text-sm text-slate-500">{year}年に対象のトランシットは見つかりませんでした</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-indigo-900/40" style={{ background: 'rgba(9,9,25,0.6)' }}>
          <div style={{ minWidth: 640 }}>
            {/* 月ヘッダー */}
            <div className="flex items-stretch border-b border-slate-700/50 sticky top-0">
              <div className="shrink-0 px-3 py-2 text-[10px] text-slate-500" style={{ width: LABEL_W }}>
                {year}年
              </div>
              <div className="relative flex-1 flex">
                {MONTH_LABELS.map((m, i) => (
                  <div
                    key={m}
                    className="flex-1 text-center text-[10px] text-slate-400 py-2 border-l border-slate-800/40"
                    style={i === 0 ? { borderLeft: 'none' } : undefined}
                  >
                    {m}
                  </div>
                ))}
                {/* 今日マーカー（ヘッダーのラベル） */}
                {showToday && (
                  <div
                    className="absolute top-0 z-20 -translate-x-1/2 text-[9px] font-bold text-rose-300 whitespace-nowrap"
                    style={{ left: `${todayPct}%` }}
                  >
                    ▼今日
                  </div>
                )}
              </div>
            </div>

            {/* 各バンド行 */}
            {bands.map((band, idx) => {
              const startDoy = dayOfYearFromISO(band.startDate, year)
              const endDoy = dayOfYearFromISO(band.endDate, year)
              const exactDoy = dayOfYearFromISO(band.exactDate, year)
              const leftPct = (startDoy / totalDays) * 100
              const widthPct = Math.max(((endDoy - startDoy + 1) / totalDays) * 100, 0.8)
              const exactPct = (exactDoy / totalDays) * 100
              const color = TRANSIT_COLORS[band.transitPlanet]
              const isSel = selected === idx
              const label = `T ${PLANET_NAMES_JA[band.transitPlanet]} × ${PLANET_NAMES_JA[band.natalPoint]}`
              const angle = ASPECT_ANGLES[band.aspect]
              const major = isMajorAngle(angle)

              return (
                <div key={idx}>
                  <div
                    className={[
                      'flex items-stretch border-b border-slate-800/30 cursor-pointer transition-colors',
                      isSel ? 'bg-purple-950/30' : 'hover:bg-slate-800/20',
                    ].join(' ')}
                    onClick={() => setSelected(isSel ? null : idx)}
                  >
                    {/* ラベル */}
                    <div className="shrink-0 px-3 py-2 flex flex-col justify-center" style={{ width: LABEL_W }}>
                      <span className={`text-xs font-medium ${color.text}`}>{label}</span>
                      {major ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-300 mt-0.5">
                          <span className="text-amber-400">★</span>{angle}°
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-0.5">{angle}°</span>
                      )}
                    </div>

                    {/* タイムライン帯 */}
                    <div className="relative flex-1 my-2 mr-2">
                      {/* 月グリッド */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {MONTH_LABELS.map((m, i) => (
                          <div
                            key={m}
                            className="flex-1 border-l border-slate-800/30"
                            style={i === 0 ? { borderLeft: 'none' } : undefined}
                          />
                        ))}
                      </div>
                      {/* 今日ライン（現在の年のみ・実線で強調） */}
                      {showToday && (
                        <div
                          className="absolute -top-2 -bottom-2 w-px bg-rose-400/80 pointer-events-none z-10"
                          style={{ left: `${todayPct}%` }}
                        />
                      )}
                      {/* バー */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: color.bar }}
                      />
                      {/* 正確点マーカー（合0°・矩90°・衝180°は白リングで強調） */}
                      <div
                        className={[
                          'absolute top-1/2 -translate-y-1/2 rounded-full',
                          major ? 'w-3 h-3 border-2 border-white' : 'w-2.5 h-2.5 border border-white/70',
                        ].join(' ')}
                        style={{ left: `calc(${exactPct}% - ${major ? 6 : 5}px)`, background: color.dot }}
                        title={`最接近 ${fmtDate(band.exactDate)}（${angle}° / orb ${band.minOrb.toFixed(1)}°）`}
                      />
                    </div>
                  </div>

                  {/* 選択中の詳細（クリックした行のすぐ下） */}
                  {isSel && (() => {
                    const master = TRANSIT_MASTER[`${band.transitPlanet}-${band.natalPoint}-${aspectCategory(band.aspect)}`]
                    return (
                      <div className="border-b border-slate-700/50 px-4 py-4 space-y-3" style={{ background: 'rgba(20,20,40,0.6)' }}>
                        <div className="text-xs">
                          <span className={`font-semibold ${color.text}`}>
                            T {PLANET_NAMES_JA[band.transitPlanet]} × {PLANET_NAMES_JA[band.natalPoint]}
                          </span>
                          <span className={`ml-2 font-bold ${major ? 'text-amber-300' : 'text-slate-400'}`}>
                            {major && '★'}{angle}°
                          </span>
                          <span className="text-slate-500 ml-1">（{ASPECT_NAMES_JA[band.aspect].split('（')[0]}）</span>
                          <span className="text-slate-400 ml-2">
                            {fmtDate(band.startDate)} 〜 {fmtDate(band.endDate)}（最接近 {fmtDate(band.exactDate)}）
                          </span>
                        </div>

                        {master ? (
                          <div className="space-y-3">
                            <p className="text-sm font-bold text-white">{master.title}</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{master.summary}</p>

                            <div>
                              <p className="text-[10px] text-purple-400 tracking-widest font-medium mb-1">この時期に起きやすいこと</p>
                              <ul className="space-y-0.5">
                                {master.events.map((e, i) => (
                                  <li key={i} className="text-sm text-slate-300 flex gap-1.5">
                                    <span className="text-purple-500 shrink-0">・</span>
                                    <span>{e}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-[10px] text-purple-400 tracking-widest font-medium mb-1">この時期の過ごし方</p>
                              <p className="text-sm text-slate-300 leading-relaxed">{master.howToSpend}</p>
                            </div>

                            <div>
                              <p className="text-[10px] text-amber-400 tracking-widest font-medium mb-1">注意点</p>
                              <p className="text-sm text-slate-300 leading-relaxed">{master.caution}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 italic">（解説文を準備中です）</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 凡例 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1"><span className="text-amber-400">★</span>合0°・矩90°・衝180°（特に強い角度）</span>
        {showToday && <span className="flex items-center gap-1"><span className="inline-block w-2 h-px bg-rose-400" />今日</span>}
        <span>●＝最接近（正確になる）日</span>
      </div>
    </div>
  )
}
