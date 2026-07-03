'use client'

import { useState } from 'react'
import { PLANET_NAMES_JA } from '@/src/lib/astrology/constants'
import type { PlanetKey } from '@/src/lib/astrology/constants'
import { HOUSE_PLANET_MASTER } from '@/src/data/house-planet-master'

type Props = {
  houseCusps: number[]
  housePlanets: Record<number, PlanetKey[]>
}

const ZODIAC_SIGNS = [
  '牡羊座', '牡牛座', '双子座', '蟹座',
  '獅子座', '乙女座', '天秤座', '蠍座',
  '射手座', '山羊座', '水瓶座', '魚座',
]

function toZodiacSign(lon: number): string {
  return ZODIAC_SIGNS[Math.floor(lon / 30)]
}

function toDegMin(lon: number): string {
  const inSign = lon % 30
  const deg = Math.floor(inSign)
  const min = Math.floor((inSign - deg) * 60)
  return `${deg}°${String(min).padStart(2, '0')}'`
}

const PLANET_SYMBOLS: Record<PlanetKey, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  asc: 'AC', mc: 'MC', desc: 'DC',
}

export function HouseList({ houseCusps, housePlanets }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  return (
    <div className="mt-2">
      {houseCusps.map((cusp, i) => {
        const houseNum = i + 1
        const planets = housePlanets[houseNum] ?? []
        return (
          <div key={houseNum} className="border-b border-slate-800/40 last:border-0">
            <div className="flex items-center gap-3 text-sm py-1.5">
              <span className="text-purple-400 w-20 shrink-0 font-medium whitespace-nowrap">第{houseNum}ハウス</span>
              <span className="text-slate-500 text-xs w-24 shrink-0">
                {toZodiacSign(cusp)} {toDegMin(cusp)}
              </span>
              <span className="flex-1 flex flex-wrap gap-x-1 gap-y-1">
                {planets.length > 0 ? (
                  planets.map(p => {
                    const key = `${houseNum}-${p}`
                    const isOpen = openKey === key
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className={[
                          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors',
                          isOpen
                            ? 'bg-purple-600/30 text-purple-200'
                            : 'text-slate-300 hover:bg-purple-900/30 hover:text-purple-200',
                        ].join(' ')}
                      >
                        <span className="text-purple-300 font-mono">{PLANET_SYMBOLS[p]}</span>
                        <span className="text-xs underline decoration-dotted underline-offset-2">{PLANET_NAMES_JA[p]}</span>
                      </button>
                    )
                  })
                ) : (
                  <span className="text-slate-600">－</span>
                )}
              </span>
            </div>

            {/* 展開エリア: この行の天体のうち開いているものの解説 */}
            {planets.map(p => {
              const key = `${houseNum}-${p}`
              if (openKey !== key) return null
              return (
                <div
                  key={key}
                  className="mb-2 ml-20 rounded-lg border border-purple-900/40 p-3"
                  style={{ background: 'rgba(20,20,40,0.6)' }}
                >
                  <p className="text-xs font-semibold text-purple-200 mb-1">
                    第{houseNum}ハウスの{PLANET_NAMES_JA[p]}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {HOUSE_PLANET_MASTER[key] ?? '（説明データを準備中）'}
                  </p>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
