import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { calculateTransitBands } from '@/src/lib/astrology/transit'
import { detectPairAspects } from '@/src/lib/astrology/aspects'
import { calculatePairTriggerWindows } from '@/src/lib/astrology/pair-aspect-triggers'
import { calculateTransitOverlapTriggerWindows } from '@/src/lib/astrology/transit-overlap-triggers'
import { calculateDirectionAspects } from '@/src/lib/astrology/directions'
import { calculateDirectionTriggerWindows } from '@/src/lib/astrology/direction-aspect-triggers'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { yieldToClient } from '@/src/lib/asyncYield'
import { computeMeishikiFromBirth } from '@/src/lib/meishikiCalc'
import { TransitTimeline } from './TransitTimeline'

type Props = {
  birthday: Date
  birthTime: string | null
  birthCity: string | null
}

export async function TransitSection({ birthday, birthTime, birthCity }: Props) {
  await yieldToClient()

  const cityCoords = birthCity ? (CITY_COORDS[birthCity] ?? null) : null
  const hasTime = !!birthTime && !!cityCoords

  const natalPositions = calculatePlanetPositions(birthday, birthTime, cityCoords)
  const pairAspects = detectPairAspects(natalPositions, hasTime)

  const now = new Date()
  const yearThis = now.getFullYear()
  const todayISO = `${yearThis}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // 過去2年〜今年〜4年先の7年分（デフォルト表示は今年）
  const years = Array.from({ length: 7 }, (_, i) => {
    const year = yearThis - 2 + i
    const bands = calculateTransitBands(natalPositions, year, hasTime)
    const triggerWindows = [
      ...calculatePairTriggerWindows(natalPositions, pairAspects, bands, year, hasTime),
      ...calculateTransitOverlapTriggerWindows(natalPositions, pairAspects, bands, year, hasTime),
    ]
    // AIプロンプト用：その年のダイレクション（ソーラーアーク）と、その発動期間
    const directions = calculateDirectionAspects(birthday, natalPositions, hasTime, year, year)
    const directionTriggerWindows = calculateDirectionTriggerWindows(birthday, natalPositions, hasTime, year, bands)
    return { year, bands, triggerWindows, directions, directionTriggerWindows }
  })

  const birthdayISO = `${birthday.getFullYear()}-${String(birthday.getMonth() + 1).padStart(2, '0')}-${String(birthday.getDate()).padStart(2, '0')}`
  // 四柱推命の年運用（人生年表と同じく日柱・月支・元命を使う）
  const meishiki = computeMeishikiFromBirth(birthday, birthTime)
  const dayStem = meishiki.pillars[2].stem
  const dayBranch = meishiki.pillars[2].branch
  const monthBranch = meishiki.pillars[1].branch
  const shichu = dayStem !== null && dayBranch !== null && monthBranch !== null
    ? { dayStem, dayBranch, monthBranch, genmei: meishiki.pillars[1].tsuhenBranch }
    : null
  const promptContext = { birthdayISO, birthTime, birthCity, hasTime, natalPositions, shichu }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-purple-400 tracking-widest font-medium">TRANSIT</p>
        <h2 className="text-lg font-bold text-white mt-0.5">運気（トランシット）</h2>
        <p className="text-xs text-slate-500 mt-1">
          トランシット（現在の空の星）が出生図に与える影響の時期です。冥王星・海王星・天王星・土星・木星の順に表示しています。
        </p>
        {!hasTime && (
          <p className="text-xs text-slate-500 mt-1">
            ※ 生まれた時間・都市を登録するとASC・MCへのトランシットも表示できます
          </p>
        )}
      </div>
      <TransitTimeline years={years} todayISO={todayISO} promptContext={promptContext} />
    </div>
  )
}
