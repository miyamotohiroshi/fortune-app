import { prisma } from '@/src/lib/prisma'
import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { detectPairAspects, detectTripleAspects, tripleComboKey, pairComboKey } from '@/src/lib/astrology/aspects'
import { PLANET_NAMES_JA, ASPECT_NAMES_JA, ASPECT_SYMBOLS } from '@/src/lib/astrology/constants'
import type { PlanetKey } from '@/src/lib/astrology/constants'
import { CITY_COORDS } from '@/src/lib/astrology/cities'

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

const PLANET_SYMBOLS: Record<PlanetKey, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  asc: 'AC', mc: 'MC',
}

export async function WesternAstrologySection({ birthday, birthTime, birthCity }: Props) {
  const cityCoords = birthCity ? (CITY_COORDS[birthCity] ?? null) : null
  const hasTime = !!birthTime && !!cityCoords

  const positions = calculatePlanetPositions(birthday, birthTime, cityCoords)

  const rawPairAspects = detectPairAspects(positions, hasTime)

  const ASPECT_SORT_ORDER: Record<string, number> = {
    conjunction: 0, opposition: 1, square: 2,
    trine: 3, sextile: 4, semisquare: 5, sesquiquadrate: 6,
  }
  const pairAspects = [...rawPairAspects].sort((a, b) => {
    const od = ASPECT_SORT_ORDER[a.aspect] - ASPECT_SORT_ORDER[b.aspect]
    return od !== 0 ? od : a.orb - b.orb
  })

  const tripleAspects = detectTripleAspects(positions, rawPairAspects, hasTime)

  // DB からアスペクト説明を取得
  const pairIds = pairAspects.map(pa => pairComboKey(pa.planet1, pa.planet2, pa.aspect))
  const tripleIds = tripleAspects.map(ta => tripleComboKey(ta.planets))

  const [pairDataList, tripleDataList] = await Promise.all([
    prisma.aspectPairData.findMany({ where: { id: { in: pairIds } } }),
    prisma.aspectTripleData.findMany({ where: { id: { in: tripleIds } } }),
  ])

  const pairDataMap = new Map(pairDataList.map((d: { id: string; title: string; description: string }) => [d.id, d]))
  const tripleDataMap = new Map(tripleDataList.map((d: { id: string; title: string; description: string }) => [d.id, d]))

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
            ※ 生まれた時間・都市を登録するとASC・MCも計算できます
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
          {(Object.keys(positions) as PlanetKey[]).map(planet => {
            if ((planet === 'asc' || planet === 'mc') && !hasTime) return null
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

      {/* ── ペアアスペクト ── */}
      {pairAspects.length > 0 && (
        <div
          className="rounded-2xl border border-indigo-900/40 p-5 space-y-4"
          style={{ background: 'rgba(9,9,25,0.6)' }}
        >
          <div>
            <p className="text-[10px] text-indigo-400 tracking-widest font-medium">ASPECTS</p>
            <h2 className="text-lg font-bold text-white mt-0.5">2天体のアスペクト</h2>
          </div>

          <div className="space-y-4">
            {pairAspects.map(pa => {
              const key = pairComboKey(pa.planet1, pa.planet2, pa.aspect)
              const data = pairDataMap.get(key)
              return (
                <div key={key} className="border-b border-slate-800/60 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg text-purple-300">{ASPECT_SYMBOLS[pa.aspect]}</span>
                    <span className="text-sm font-semibold text-white">
                      {PLANET_NAMES_JA[pa.planet1]} × {PLANET_NAMES_JA[pa.planet2]}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto flex items-baseline gap-1.5">
                      {ASPECT_NAMES_JA[pa.aspect]}
                      <span className="text-[10px] text-slate-600">orb {pa.orb.toFixed(1)}°</span>
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

          <div className="space-y-4">
            {tripleAspects.map(ta => {
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

      {pairAspects.length === 0 && (
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
