import type { PlanetKey } from './constants'
import type { PlanetPositions } from './planets'
import { calculateBandsForPlanet, TRANSIT_PLANETS } from './transit'
import type { TransitBand, ExtendedTransitPlanetKey } from './transit'
import { TRANSIT_OVERLAP_TRIGGER_PATTERNS } from '@/src/data/transit-overlap-triggers'

export type TransitOverlapTriggerWindow = {
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
// 計算済みでない天体（火星など）はその場で算出する
function bandsFor(
  natalPositions: PlanetPositions,
  transitPlanet: ExtendedTransitPlanetKey,
  natalPoint: PlanetKey,
  year: number,
  precomputedBands: TransitBand[],
): Pick<TransitBand, 'startDate' | 'endDate' | 'exactDate' | 'minOrb' | 'aspect'>[] {
  if (TRANSIT_PLANET_SET.has(transitPlanet)) {
    return precomputedBands.filter(b => b.transitPlanet === transitPlanet && b.natalPoint === natalPoint)
  }
  return calculateBandsForPlanet(natalPositions, transitPlanet, [natalPoint], year)
}

// 出生の1天体に対するベースのトランシットに、別のトランシット天体が重なり、
// かつ除外天体が絡んでいない「発動期間」を算出する。1年分（precomputedBandsと同じ年）を対象とする
export function calculateTransitOverlapTriggerWindows(
  natalPositions: PlanetPositions,
  precomputedBands: TransitBand[],
  year: number,
  hasTime: boolean,
): TransitOverlapTriggerWindow[] {
  const results: TransitOverlapTriggerWindow[] = []

  for (const pattern of TRANSIT_OVERLAP_TRIGGER_PATTERNS) {
    const needsTime = pattern.natalPoint === 'asc' || pattern.natalPoint === 'mc'
    if (needsTime && !hasTime) continue

    let baseBands = bandsFor(natalPositions, pattern.baseTransitPlanet, pattern.natalPoint, year, precomputedBands)
    if (pattern.baseAspectTypes) {
      baseBands = baseBands.filter(b => pattern.baseAspectTypes!.includes(b.aspect))
    }
    if (baseBands.length === 0) continue

    let overlapBands = bandsFor(natalPositions, pattern.overlapTransitPlanet, pattern.natalPoint, year, precomputedBands)
    if (pattern.overlapAspectTypes) {
      overlapBands = overlapBands.filter(b => pattern.overlapAspectTypes!.includes(b.aspect))
    }

    for (const b1 of baseBands) {
      for (const b2 of overlapBands) {
        if (!rangesOverlap(b1.startDate, b1.endDate, b2.startDate, b2.endDate)) continue
        const [ovStart, ovEnd] = overlapRange(b1.startDate, b1.endDate, b2.startDate, b2.endDate)

        const isExcluded = pattern.excludePlanets.some(ep => {
          const exBands = bandsFor(natalPositions, ep, pattern.natalPoint, year, precomputedBands)
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
