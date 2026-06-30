import { SunPosition } from 'astronomy-engine'
import { ASPECT_ANGLES, PLANET_KEYS } from './constants'
import type { PlanetKey, AspectType } from './constants'
import type { PlanetPositions } from './planets'

export const DIRECTION_ORB = 1.0
export const DIRECTION_IMPORTANCE_THRESHOLD = 8

export type DirectionAspectResult = {
  year: number
  age: number
  directedPlanet: PlanetKey
  natalPlanet: PlanetKey
  aspectType: AspectType
  aspectAngle: number
  orb: number
  // canonical planet pair key matching CSV format: "太陽 × 木星"
  masterKey: string
}

const PLANET_JA: Record<PlanetKey, string> = {
  sun: '太陽', moon: '月', mercury: '水星', venus: '金星', mars: '火星',
  jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星',
  pluto: '冥王星', asc: 'ASC', mc: 'MC',
}

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function masterKey(p1: PlanetKey, p2: PlanetKey): string {
  const i1 = PLANET_KEYS.indexOf(p1)
  const i2 = PLANET_KEYS.indexOf(p2)
  const [a, b] = i1 < i2 ? [p1, p2] : [p2, p1]
  return `${PLANET_JA[a]} × ${PLANET_JA[b]}`
}

export function calculateDirectionAspects(
  birthDate: Date,
  natalPositions: PlanetPositions,
  hasTime: boolean,
  startYear: number,
  endYear: number,
): DirectionAspectResult[] {
  const results: DirectionAspectResult[] = []
  const planets = (hasTime ? PLANET_KEYS : PLANET_KEYS.filter(k => k !== 'asc' && k !== 'mc')) as PlanetKey[]
  const sunNatal = natalPositions.sun
  const birthYear = birthDate.getFullYear()

  for (let year = startYear; year <= endYear; year++) {
    const age = year - birthYear
    // Solar arc: progressed Sun at (birthDate + age days), 1 day = 1 year
    const progressedDate = new Date(birthDate.getTime() + age * 24 * 60 * 60 * 1000)
    const sunProgressed = norm360(SunPosition(progressedDate).elon)
    const solarArc = norm360(sunProgressed - sunNatal)

    for (const dp of planets) {
      const dpPos = norm360(natalPositions[dp] + solarArc)
      for (const np of planets) {
        if (dp === np) continue
        const diff = angularDiff(dpPos, natalPositions[np])
        for (const [asp, angle] of Object.entries(ASPECT_ANGLES) as [AspectType, number][]) {
          const orb = Math.abs(diff - angle)
          if (orb <= DIRECTION_ORB) {
            results.push({
              year,
              age,
              directedPlanet: dp,
              natalPlanet: np,
              aspectType: asp,
              aspectAngle: angle,
              orb,
              masterKey: masterKey(dp, np),
            })
          }
        }
      }
    }
  }

  return results
}
