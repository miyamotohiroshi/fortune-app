import type { PlanetKey } from './constants'
import type { PlanetPositions } from './planets'
import { calculateBandsForPlanet, TRANSIT_PLANETS } from './transit'
import type { TransitBand } from './transit'
import { calculateDirectionAspects } from './directions'
import { DIRECTION_TRIGGER_PATTERNS } from '@/src/data/direction-trigger-patterns'

export type DirectionTriggerWindow = {
  patternId: string
  directionYear: number
  startDate: string // ISO yyyy-mm-dd
  endDate: string
  exactDate: string
  minOrb: number
}

const TRANSIT_PLANET_SET = new Set<string>(TRANSIT_PLANETS)

// 指定天体×出生点のバンドを取得する。表示用に計算済みのバンド（木星・土星など）があれば再利用し、
// 計算済みでない天体（太陽・水星など）はその場で算出する
function bandsFor(
  natalPositions: PlanetPositions,
  transitPlanet: DirectionTriggerPatternPlanet,
  natalPoint: PlanetKey,
  year: number,
  precomputedBands: TransitBand[],
): Pick<TransitBand, 'startDate' | 'endDate' | 'exactDate' | 'minOrb'>[] {
  if (TRANSIT_PLANET_SET.has(transitPlanet)) {
    return precomputedBands.filter(b => b.transitPlanet === transitPlanet && b.natalPoint === natalPoint)
  }
  return calculateBandsForPlanet(natalPositions, transitPlanet, [natalPoint], year)
}

type DirectionTriggerPatternPlanet = (typeof DIRECTION_TRIGGER_PATTERNS)[number]['triggerPlanet']

// ダイレクション（進行）で発動中の出生アスペクトに、トランシット天体が重なる
// 「発動期間」を1年分算出する
export function calculateDirectionTriggerWindows(
  birthday: Date,
  natalPositions: PlanetPositions,
  hasTime: boolean,
  year: number,
  precomputedBands: TransitBand[],
): DirectionTriggerWindow[] {
  const results: DirectionTriggerWindow[] = []
  const angleInvolved = (p: PlanetKey) => p === 'asc' || p === 'mc' || p === 'desc'

  for (const pattern of DIRECTION_TRIGGER_PATTERNS) {
    if (!hasTime && (angleInvolved(pattern.directedPlanet) || angleInvolved(pattern.natalPlanet))) continue

    const directionHits = calculateDirectionAspects(birthday, natalPositions, hasTime, year, year).filter(
      d =>
        d.directedPlanet === pattern.directedPlanet &&
        d.natalPlanet === pattern.natalPlanet &&
        (!pattern.directionAspectTypes || pattern.directionAspectTypes.includes(d.aspectType))
    )
    if (directionHits.length === 0) continue

    const bands = bandsFor(natalPositions, pattern.triggerPlanet, pattern.triggerNatalPoint, year, precomputedBands)
    for (const b of bands) {
      results.push({
        patternId: pattern.id,
        directionYear: year,
        startDate: b.startDate,
        endDate: b.endDate,
        exactDate: b.exactDate,
        minOrb: b.minOrb,
      })
    }
  }

  results.sort((a, b) => a.startDate.localeCompare(b.startDate))
  return results
}
