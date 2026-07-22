import type { PlanetKey } from './constants'
import type { PlanetPositions } from './planets'
import type { PairAspect } from './aspects'
import { calculateBandsForPlanet, TRANSIT_PLANETS } from './transit'
import type { TransitBand, ExtendedTransitPlanetKey } from './transit'
import { PAIR_TRIGGER_PATTERNS } from '@/src/data/pair-aspect-triggers'

type DateBand = Pick<TransitBand, 'startDate' | 'endDate' | 'exactDate' | 'minOrb' | 'aspect'>

export type PairTriggerWindow = {
  patternId: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string
  exactDate: string
  minOrb: number
}

const TRANSIT_PLANET_SET = new Set<string>(TRANSIT_PLANETS)

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

function overlapRange(aStart: string, aEnd: string, bStart: string, bEnd: string): [string, string] {
  return [aStart > bStart ? aStart : bStart, aEnd < bEnd ? aEnd : bEnd]
}

function clamp(value: string, min: string, max: string): string {
  if (value < min) return min
  if (value > max) return max
  return value
}

// 指定天体×出生点のバンドを取得する。表示用に計算済みのバンド（木星・土星など）があれば再利用し、
// 計算済みでない天体（火星など、除外条件チェック専用）はその場で算出する
function bandsFor(
  natalPositions: PlanetPositions,
  transitPlanet: ExtendedTransitPlanetKey,
  natalPoint: PlanetKey,
  year: number,
  precomputedBands: TransitBand[],
): DateBand[] {
  if (TRANSIT_PLANET_SET.has(transitPlanet)) {
    return precomputedBands.filter(b => b.transitPlanet === transitPlanet && b.natalPoint === natalPoint)
  }
  return calculateBandsForPlanet(natalPositions, transitPlanet, [natalPoint], year)
}

// 出生ペアアスペクトに、進行中のトランシット天体が関与し、かつ除外天体が絡んでいない
// 「発動期間」を算出する。1年分（precomputedBandsと同じ年）を対象とする
export function calculatePairTriggerWindows(
  natalPositions: PlanetPositions,
  pairAspects: PairAspect[],
  precomputedBands: TransitBand[],
  year: number,
  hasTime: boolean,
): PairTriggerWindow[] {
  const results: PairTriggerWindow[] = []

  for (const pattern of PAIR_TRIGGER_PATTERNS) {
    const [p1, p2] = pattern.planets
    const needsTime = [p1, p2].some(p => p === 'asc' || p === 'mc')
    if (needsTime && !hasTime) continue

    const hasNatalAspect = pairAspects.some(
      pa =>
        ((pa.planet1 === p1 && pa.planet2 === p2) || (pa.planet1 === p2 && pa.planet2 === p1)) &&
        (!pattern.natalAspectTypes || pattern.natalAspectTypes.includes(pa.aspect))
    )
    if (!hasNatalAspect) continue

    let bands1 = bandsFor(natalPositions, pattern.triggerPlanet, p1, year, precomputedBands)
    let bands2 = bandsFor(natalPositions, pattern.triggerPlanet, p2, year, precomputedBands)
    if (pattern.triggerAspectTypes) {
      bands1 = bands1.filter(b => pattern.triggerAspectTypes!.includes(b.aspect))
      bands2 = bands2.filter(b => pattern.triggerAspectTypes!.includes(b.aspect))
    }

    for (const b1 of bands1) {
      for (const b2 of bands2) {
        if (!rangesOverlap(b1.startDate, b1.endDate, b2.startDate, b2.endDate)) continue
        const [ovStart, ovEnd] = overlapRange(b1.startDate, b1.endDate, b2.startDate, b2.endDate)

        const isExcluded = pattern.excludePlanets.some(ep => {
          const exBands = [
            ...bandsFor(natalPositions, ep, p1, year, precomputedBands),
            ...bandsFor(natalPositions, ep, p2, year, precomputedBands),
          ]
          return exBands.some(eb => rangesOverlap(eb.startDate, eb.endDate, ovStart, ovEnd))
        })
        if (isExcluded) continue

        const closer = b1.minOrb <= b2.minOrb ? b1 : b2
        results.push({
          patternId: pattern.id,
          startDate: ovStart,
          endDate: ovEnd,
          exactDate: clamp(closer.exactDate, ovStart, ovEnd),
          minOrb: Math.max(b1.minOrb, b2.minOrb),
        })
      }
    }
  }

  results.sort((a, b) => a.startDate.localeCompare(b.startDate))
  return results
}
