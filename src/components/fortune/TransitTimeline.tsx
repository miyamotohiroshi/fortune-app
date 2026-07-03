'use client'

import { useState } from 'react'
import type { TransitBand, TransitPlanetKey } from '@/src/lib/astrology/transit'
import { PLANET_NAMES_JA, ASPECT_NAMES_JA } from '@/src/lib/astrology/constants'
import { TRANSIT_MASTER, aspectCategory } from '@/src/data/transit-master'

type Props = {
  bands: TransitBand[]
  year: number
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

export function TransitTimeline({ bands, year }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const totalDays = isLeapYear(year) ? 366 : 365

  if (bands.length === 0) {
    return (
      <div
        className="rounded-2xl border border-slate-800/40 p-5 text-center"
        style={{ background: 'rgba(9,9,25,0.6)' }}
      >
        <p className="text-sm text-slate-500">対象のトランシットは見つかりませんでした</p>
      </div>
    )
  }

  const LABEL_W = 150

  return (
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
                  <span className="text-[10px] text-slate-500">
                    {ASPECT_NAMES_JA[band.aspect].split('（')[0]}
                  </span>
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
                  {/* バー */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: color.bar }}
                  />
                  {/* 正確点マーカー */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white/70"
                    style={{ left: `calc(${exactPct}% - 5px)`, background: color.dot }}
                    title={`最接近 ${fmtDate(band.exactDate)}（orb ${band.minOrb.toFixed(1)}°）`}
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
                        T {PLANET_NAMES_JA[band.transitPlanet]} × {PLANET_NAMES_JA[band.natalPoint]} {ASPECT_NAMES_JA[band.aspect]}
                      </span>
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
  )
}
