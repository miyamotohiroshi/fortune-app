import { PLANET_KEYS, PLANET_ORB_WEIGHT, ASPECT_ANGLES } from './constants'
import type { PlanetKey, AspectType } from './constants'
import type { PlanetPositions } from './planets'

export type PairAspect = {
  planet1: PlanetKey
  planet2: PlanetKey
  aspect: AspectType
  orb: number
}

export type TripleAspect = {
  planets: [PlanetKey, PlanetKey, PlanetKey]
  aspects: [AspectType, AspectType, AspectType]
  orbs: [number, number, number]
}

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function getOrb(p1: PlanetKey, p2: PlanetKey, aspect: AspectType): number {
  if (aspect === 'semisquare' || aspect === 'sesquiquadrate') return 1
  return Math.max(PLANET_ORB_WEIGHT[p1], PLANET_ORB_WEIGHT[p2])
}

export function detectPairAspects(
  positions: PlanetPositions,
  hasTime: boolean
): PairAspect[] {
  const results: PairAspect[] = []
  const keys = hasTime ? PLANET_KEYS : PLANET_KEYS.filter(k => k !== 'asc' && k !== 'mc' && k !== 'desc')

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const p1 = keys[i]
      const p2 = keys[j]
      const diff = angularDiff(positions[p1], positions[p2])

      for (const [aspectName, targetAngle] of Object.entries(ASPECT_ANGLES) as [AspectType, number][]) {
        const orb = getOrb(p1, p2, aspectName)
        if (Math.abs(diff - targetAngle) <= orb) {
          results.push({
            planet1: p1,
            planet2: p2,
            aspect: aspectName,
            orb: Math.abs(diff - targetAngle),
          })
          break // one aspect per pair (closest match wins)
        }
      }
    }
  }

  return results
}

export function detectTripleAspects(
  positions: PlanetPositions,
  pairAspects: PairAspect[],
  hasTime: boolean
): TripleAspect[] {
  const results: TripleAspect[] = []
  const keys = hasTime ? PLANET_KEYS : PLANET_KEYS.filter(k => k !== 'asc' && k !== 'mc' && k !== 'desc')

  // Build a lookup of pairs that are in aspect
  type PairKey = string
  const pairMap = new Map<PairKey, PairAspect>()
  for (const pa of pairAspects) {
    pairMap.set(`${pa.planet1}|${pa.planet2}`, pa)
    pairMap.set(`${pa.planet2}|${pa.planet1}`, pa)
  }

  function pairKey(a: PlanetKey, b: PlanetKey): PairKey {
    const idx1 = PLANET_KEYS.indexOf(a)
    const idx2 = PLANET_KEYS.indexOf(b)
    return idx1 < idx2 ? `${a}|${b}` : `${b}|${a}`
  }

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      for (let k = j + 1; k < keys.length; k++) {
        const p1 = keys[i]
        const p2 = keys[j]
        const p3 = keys[k]

        const ab = pairMap.get(pairKey(p1, p2))
        const bc = pairMap.get(pairKey(p2, p3))
        const ac = pairMap.get(pairKey(p1, p3))

        // All three pairs must be in aspect
        if (ab && bc && ac) {
          results.push({
            planets: [p1, p2, p3],
            aspects: [ab.aspect, bc.aspect, ac.aspect],
            orbs: [ab.orb, bc.orb, ac.orb],
          })
        }
      }
    }
  }

  return results
}

export function tripleComboKey(planets: [PlanetKey, PlanetKey, PlanetKey]): string {
  return [...planets]
    .sort((a, b) => PLANET_KEYS.indexOf(a) - PLANET_KEYS.indexOf(b))
    .join('|')
}

export function pairComboKey(p1: PlanetKey, p2: PlanetKey, aspect: AspectType): string {
  const sorted = [p1, p2].sort((a, b) => PLANET_KEYS.indexOf(a) - PLANET_KEYS.indexOf(b))
  return `${sorted[0]}|${sorted[1]}|${aspect}`
}
