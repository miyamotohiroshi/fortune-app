import type { PlanetKey } from './constants'
import type { PlanetPositions } from './planets'

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

// イコールハウス方式: ASC(上昇点)を第1ハウスの始点とし、30°ずつ均等に12分割する
export function calculateHouseCusps(asc: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30))
}

export function getHouseNumber(lon: number, asc: number): number {
  const diff = norm360(lon - asc)
  return Math.floor(diff / 30) + 1 // 1〜12
}

// ハウスに配置される天体（ASC・MC・DESCなどの感受点自体はハウスの基準点なので対象外）
const HOUSE_PLANETS: PlanetKey[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
]

export function assignPlanetsToHouses(
  positions: PlanetPositions,
  asc: number
): Record<number, PlanetKey[]> {
  const result: Record<number, PlanetKey[]> = {}
  for (let h = 1; h <= 12; h++) result[h] = []

  for (const planet of HOUSE_PLANETS) {
    const house = getHouseNumber(positions[planet], asc)
    result[house].push(planet)
  }

  return result
}
