import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { calculateDirectionAspects } from '@/src/lib/astrology/directions'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { computeMeishikiFromBirth } from '@/src/lib/meishikiCalc'
import { DirectionLifeTab } from './DirectionLifeTab'

type Props = {
  birthday: Date
  birthTime: string | null
  birthCity: string | null
}

const DISPLAY_START_OFFSET = 0   // years from birth
const DISPLAY_END_OFFSET = 100   // years from birth

export async function DirectionLifeSection({ birthday, birthTime, birthCity }: Props) {
  const cityCoords = birthCity ? (CITY_COORDS[birthCity] ?? null) : null
  const hasTime = !!birthTime && !!cityCoords

  const natalPositions = calculatePlanetPositions(birthday, birthTime, cityCoords)

  const birthYear = birthday.getFullYear()
  const currentYear = new Date().getFullYear()
  const startYear = birthYear + DISPLAY_START_OFFSET
  const endYear = birthYear + DISPLAY_END_OFFSET

  const aspects = calculateDirectionAspects(
    birthday,
    natalPositions,
    hasTime,
    startYear,
    endYear,
  )

  // 四柱推命の年運（流年）用に日柱（日干・日支）と元命（月支本気の通変星）を算出
  const meishiki = computeMeishikiFromBirth(birthday, birthTime)
  const dayStem = meishiki.pillars[2].stem
  const dayBranch = meishiki.pillars[2].branch
  const genmei = meishiki.pillars[1].tsuhenBranch // 元命（通変星ID 1-10）

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-purple-400 tracking-widest font-medium">DIRECTION</p>
        <h2 className="text-lg font-bold text-white mt-0.5">人生年表</h2>
        {!hasTime && (
          <p className="text-xs text-slate-500 mt-1">
            ※ 生まれた時間・都市を登録するとASC・MCも計算できます
          </p>
        )}
      </div>
      <DirectionLifeTab
        aspects={aspects}
        startYear={startYear}
        endYear={endYear}
        currentYear={currentYear}
        birthday={birthday.toISOString()}
        dayStem={dayStem}
        dayBranch={dayBranch}
        genmei={genmei}
      />
    </div>
  )
}
