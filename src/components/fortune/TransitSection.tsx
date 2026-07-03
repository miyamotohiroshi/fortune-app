import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { calculateTransitBands } from '@/src/lib/astrology/transit'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { TransitTimeline } from './TransitTimeline'

type Props = {
  birthday: Date
  birthTime: string | null
  birthCity: string | null
}

export function TransitSection({ birthday, birthTime, birthCity }: Props) {
  const cityCoords = birthCity ? (CITY_COORDS[birthCity] ?? null) : null
  const hasTime = !!birthTime && !!cityCoords

  const natalPositions = calculatePlanetPositions(birthday, birthTime, cityCoords)
  const year = new Date().getFullYear()
  const bands = calculateTransitBands(natalPositions, year, hasTime)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-purple-400 tracking-widest font-medium">TRANSIT</p>
        <h2 className="text-lg font-bold text-white mt-0.5">{year}年の運気</h2>
        <p className="text-xs text-slate-500 mt-1">
          トランシット（現在の空の星）が出生図に与える影響の時期です。冥王星・海王星・天王星・土星・木星の順に表示しています。
        </p>
        {!hasTime && (
          <p className="text-xs text-slate-500 mt-1">
            ※ 生まれた時間・都市を登録するとASC・MCへのトランシットも表示できます
          </p>
        )}
      </div>
      <TransitTimeline bands={bands} year={year} />
    </div>
  )
}
