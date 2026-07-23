import { prisma } from '@/src/lib/prisma'
import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { detectPairAspects, detectTripleAspects, tripleComboKey, pairComboKey } from '@/src/lib/astrology/aspects'
import type { TripleAspect } from '@/src/lib/astrology/aspects'
import { calculateHouseCusps, assignPlanetsToHouses } from '@/src/lib/astrology/houses'
import { calculateTransitBands } from '@/src/lib/astrology/transit'
import { calculatePairTriggerWindows } from '@/src/lib/astrology/pair-aspect-triggers'
import type { PairTriggerWindow } from '@/src/lib/astrology/pair-aspect-triggers'
import { PAIR_TRIGGER_PATTERNS } from '@/src/data/pair-aspect-triggers'
import { TRIGGER_POLARITY_STYLE } from '@/src/lib/astrology/trigger-polarity'
import { HouseList } from './HouseList'
import { PLANET_NAMES_JA, ASPECT_NAMES_JA, ASPECT_SYMBOLS, HARD_ASPECT_TYPES } from '@/src/lib/astrology/constants'
import type { PlanetKey } from '@/src/lib/astrology/constants'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { yieldToClient } from '@/src/lib/asyncYield'

type Props = {
  birthday: Date
  birthTime: string | null
  birthCity: string | null
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

function fmtDateJa(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}/${m}/${d}`
}

const PLANET_SYMBOLS: Record<PlanetKey, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  asc: 'AC', mc: 'MC', desc: 'DC',
}

// 0°(合)・90°(矩)・180°(衝) は緊張・葛藤が強く出るハードアスペクト
const HARD_ASPECTS = new Set(HARD_ASPECT_TYPES)

export async function WesternAstrologySection({ birthday, birthTime, birthCity }: Props) {
  await yieldToClient()

  const cityCoords = birthCity ? (CITY_COORDS[birthCity] ?? null) : null
  const hasTime = !!birthTime && !!cityCoords

  const positions = calculatePlanetPositions(birthday, birthTime, cityCoords)

  const rawPairAspects = detectPairAspects(positions, hasTime)

  // 出生ペアアスペクトに進行木星などが関与する「チャンス期間」（今年〜4年先で直近1件のみ）
  const now = new Date()
  const yearThis = now.getFullYear()
  const todayISO = `${yearThis}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const nearestTriggerWindow = new Map<string, PairTriggerWindow>()
  for (let i = 0; i < 5; i++) {
    const year = yearThis + i
    const yearBands = calculateTransitBands(positions, year, hasTime)
    const windows = calculatePairTriggerWindows(positions, rawPairAspects, yearBands, year, hasTime)
    for (const w of windows) {
      if (w.endDate < todayISO) continue
      if (!nearestTriggerWindow.has(w.patternId)) nearestTriggerWindow.set(w.patternId, w)
    }
  }

  const ASPECT_SORT_ORDER: Record<string, number> = {
    conjunction: 0, opposition: 1, square: 2,
    trine: 3, sextile: 4, semisquare: 5, sesquiquadrate: 6,
  }
  const pairAspects = [...rawPairAspects].sort((a, b) => {
    const od = ASPECT_SORT_ORDER[a.aspect] - ASPECT_SORT_ORDER[b.aspect]
    return od !== 0 ? od : a.orb - b.orb
  })

  // ASC・DESC・MC（感受点）が絡む2天体アスペクトは計算はするが一覧には表示しない（3天体の組み合わせでは1つまでなら表示する）
  const ANGLE_POINTS: PlanetKey[] = ['asc', 'desc', 'mc']
  const visiblePairAspects = pairAspects.filter(
    pa => !ANGLE_POINTS.includes(pa.planet1) && !ANGLE_POINTS.includes(pa.planet2)
  )

  const rawTripleAspects = detectTripleAspects(positions, rawPairAspects, hasTime)
  // ASC・DESC・MCが2つ以上絡む組み合わせ（例: 太陽×ASC×MC）は表示しない。1つまでは表示する
  const visibleTripleAspects = rawTripleAspects.filter(
    ta => ta.planets.filter(p => ANGLE_POINTS.includes(p)).length < 2
  )
  const tripleAspects = [...visibleTripleAspects].sort((a, b) => {
    const ordA = [...a.aspects].map(asp => ASPECT_SORT_ORDER[asp]).sort((x, y) => x - y)
    const ordB = [...b.aspects].map(asp => ASPECT_SORT_ORDER[asp]).sort((x, y) => x - y)
    for (let i = 0; i < 3; i++) {
      if (ordA[i] !== ordB[i]) return ordA[i] - ordB[i]
    }
    const sumOrbA = a.orbs.reduce((s, v) => s + v, 0)
    const sumOrbB = b.orbs.reduce((s, v) => s + v, 0)
    return sumOrbA - sumOrbB
  })
  // 3つのうち2つ以上がハードアスペクト（合・矩・衝）なら「特に強い組み合わせ」として区別する
  const isStrongTriple = (ta: TripleAspect) => ta.aspects.filter(asp => HARD_ASPECTS.has(asp)).length >= 2
  const strongTripleAspects = tripleAspects.filter(isStrongTriple)
  const normalTripleAspects = tripleAspects.filter(ta => !isStrongTriple(ta))

  // DB からアスペクト説明を取得
  const pairIds = visiblePairAspects.map(pa => pairComboKey(pa.planet1, pa.planet2, pa.aspect))
  const tripleIds = tripleAspects.map(ta => tripleComboKey(ta.planets))

  const [pairDataList, tripleDataList] = await Promise.all([
    prisma.aspectPairData.findMany({ where: { id: { in: pairIds } } }),
    prisma.aspectTripleData.findMany({ where: { id: { in: tripleIds } } }),
  ])

  const pairDataMap = new Map(pairDataList.map((d: { id: string; title: string; description: string }) => [d.id, d]))
  const tripleDataMap = new Map(tripleDataList.map((d: { id: string; title: string; description: string }) => [d.id, d]))

  const houseCusps = hasTime ? calculateHouseCusps(positions.asc) : []
  const housePlanets = hasTime ? assignPlanetsToHouses(positions, positions.asc) : {}

  return (
    <div className="space-y-5">
      {/* ── 天体位置カード ── */}
      <div
        className="rounded-2xl border border-purple-900/40 p-5 space-y-3"
        style={{ background: 'rgba(9,9,25,0.6)' }}
      >
        <p className="text-[10px] text-purple-400 tracking-widest font-medium">WESTERN ASTROLOGY</p>
        <h2 className="text-lg font-bold text-white">天体位置</h2>
        {!hasTime && (
          <p className="text-xs text-slate-500">
            ※ 生まれた時間・都市を登録するとASC・MC・DESCも計算できます
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
          {(Object.keys(positions) as PlanetKey[]).map(planet => {
            if ((planet === 'asc' || planet === 'mc' || planet === 'desc') && !hasTime) return null
            const lon = positions[planet]
            return (
              <div key={planet} className="flex items-center gap-2 text-sm">
                <span className="text-purple-400 w-6 text-center font-mono text-base leading-none">
                  {PLANET_SYMBOLS[planet]}
                </span>
                <span className="text-slate-400 w-14 shrink-0">{PLANET_NAMES_JA[planet]}</span>
                <span className="text-white font-medium shrink-0">{toZodiacSign(lon)}</span>
                <span className="text-slate-500 text-xs">{toDegMin(lon)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ハウスカード ── */}
      <div
        className="rounded-2xl border border-purple-900/40 p-5 space-y-3"
        style={{ background: 'rgba(9,9,25,0.6)' }}
      >
        <p className="text-[10px] text-purple-400 tracking-widest font-medium">HOUSES</p>
        <h2 className="text-lg font-bold text-white">ハウス</h2>
        {!hasTime ? (
          <p className="text-xs text-slate-500">
            ※ 生まれた時間・都市を登録するとハウスも計算できます
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-500">天体名をタップすると解説が表示されます</p>
            <HouseList houseCusps={houseCusps} housePlanets={housePlanets} />
          </>
        )}
      </div>

      {/* ── ペアアスペクト ── */}
      {visiblePairAspects.length > 0 && (
        <div
          className="rounded-2xl border border-indigo-900/40 p-5 space-y-4"
          style={{ background: 'rgba(9,9,25,0.6)' }}
        >
          <div>
            <p className="text-[10px] text-indigo-400 tracking-widest font-medium">ASPECTS</p>
            <h2 className="text-lg font-bold text-white mt-0.5">2天体のアスペクト</h2>
          </div>

          <div className="space-y-4">
            {visiblePairAspects.map(pa => {
              const key = pairComboKey(pa.planet1, pa.planet2, pa.aspect)
              const data = pairDataMap.get(key)
              // 0°(合)・90°(矩)・180°(衝) は影響が強く出るハードアスペクト。温度感を強めて表示する
              const isHard = HARD_ASPECTS.has(pa.aspect)
              const triggerPattern = PAIR_TRIGGER_PATTERNS.find(
                p =>
                  (p.planets[0] === pa.planet1 && p.planets[1] === pa.planet2) ||
                  (p.planets[0] === pa.planet2 && p.planets[1] === pa.planet1)
              )
              const triggerWindow = triggerPattern ? nearestTriggerWindow.get(triggerPattern.id) : undefined
              return (
                <div
                  key={key}
                  className={`border-b border-slate-800/60 pb-4 last:border-0 last:pb-0${
                    isHard ? ' border-l-2 border-l-amber-500/50 pl-3' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-lg ${isHard ? 'text-amber-300' : 'text-purple-300'}`}>
                      {ASPECT_SYMBOLS[pa.aspect]}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {PLANET_NAMES_JA[pa.planet1]} × {PLANET_NAMES_JA[pa.planet2]}
                    </span>
                    {isHard && (
                      <span className="text-[10px] font-bold text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded px-1 leading-tight">
                        強
                      </span>
                    )}
                    <span
                      className={`text-xs ml-auto flex items-baseline gap-1.5 ${
                        isHard ? 'text-amber-400/80' : 'text-slate-500'
                      }`}
                    >
                      {ASPECT_NAMES_JA[pa.aspect]}
                      <span className="text-[10px] text-slate-600">orb {pa.orb.toFixed(1)}°</span>
                    </span>
                  </div>
                  {data ? (
                    <p className="text-sm text-slate-300 leading-relaxed">{data.description}</p>
                  ) : (
                    <p className="text-xs text-slate-600 italic">（説明データを準備中）</p>
                  )}
                  {triggerWindow && triggerPattern && (() => {
                    const style = TRIGGER_POLARITY_STYLE[triggerPattern.polarity]
                    return (
                      <div
                        className={`mt-2.5 rounded-lg border ${style.border} px-3 py-2`}
                        style={{ background: style.bg }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs">{style.icon}</span>
                          <span className={`text-[11px] font-bold ${style.text}`}>{triggerPattern.title}</span>
                          <span className={`text-[11px] ml-auto opacity-80 ${style.text}`}>
                            {fmtDateJa(triggerWindow.startDate)} 〜 {fmtDateJa(triggerWindow.endDate)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">{triggerPattern.description}</p>
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── トリプルアスペクト ── */}
      {tripleAspects.length > 0 && (
        <div
          className="rounded-2xl border border-violet-900/40 p-5 space-y-4"
          style={{ background: 'rgba(9,9,25,0.6)' }}
        >
          <div>
            <p className="text-[10px] text-violet-400 tracking-widest font-medium">TRIPLE ASPECTS</p>
            <h2 className="text-lg font-bold text-white mt-0.5">3天体の組み合わせ</h2>
          </div>

          {strongTripleAspects.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>⚡</span>特に強い組み合わせ
              </p>
              <div className="space-y-4">
                {strongTripleAspects.map(ta => {
                  const key = tripleComboKey(ta.planets)
                  const data = tripleDataMap.get(key)
                  const names = ta.planets.map(p => PLANET_NAMES_JA[p]).join(' × ')
                  return (
                    <div
                      key={key}
                      className="border-b border-slate-800/60 pb-4 last:border-0 last:pb-0 border-l-2 border-l-amber-500/50 pl-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-white">{names}</p>
                        <span className="text-[10px] font-bold text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded px-1 leading-tight">
                          強
                        </span>
                      </div>
                      {data ? (
                        <p className="text-sm text-slate-300 leading-relaxed">{data.description}</p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">（説明データを準備中）</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {normalTripleAspects.length > 0 && (
            <div className="space-y-3">
              {strongTripleAspects.length > 0 && (
                <p className="text-[11px] font-medium text-slate-500 pt-3 border-t border-slate-800/60">
                  その他の組み合わせ
                </p>
              )}
              <div className="space-y-4">
                {normalTripleAspects.map(ta => {
                  const key = tripleComboKey(ta.planets)
                  const data = tripleDataMap.get(key)
                  const names = ta.planets.map(p => PLANET_NAMES_JA[p]).join(' × ')
                  return (
                    <div key={key} className="border-b border-slate-800/60 pb-4 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-white mb-1.5">{names}</p>
                      {data ? (
                        <p className="text-sm text-slate-300 leading-relaxed">{data.description}</p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">（説明データを準備中）</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {visiblePairAspects.length === 0 && (
        <div
          className="rounded-2xl border border-slate-800/40 p-5 text-center"
          style={{ background: 'rgba(9,9,25,0.6)' }}
        >
          <p className="text-sm text-slate-500">アスペクトは検出されませんでした</p>
        </div>
      )}
    </div>
  )
}
