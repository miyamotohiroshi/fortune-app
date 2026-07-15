import { calculatePlanetPositions } from './planets'
import { CITY_COORDS } from './cities'
import { computeSynastry, type SynResult } from './synastry'

// サーバー専用: ephemeris（astronomy-engine）を含むためクライアントから import しないこと。

export type BirthInput = {
  birthday: string // ISO or YYYY-MM-DD
  birthTime: string | null // "HH:MM"
  birthCity: string | null
}

/** 2人の生年月日から相性（シナストリー）を算出する */
export function synastryFromBirth(self: BirthInput, partner: BirthInput): SynResult {
  const calc = (b: BirthInput) => {
    const cityCoords = b.birthCity ? (CITY_COORDS[b.birthCity] ?? null) : null
    const pos = calculatePlanetPositions(new Date(b.birthday), b.birthTime, cityCoords)
    return { pos, avail: { hasTime: !!b.birthTime, hasCity: !!cityCoords } }
  }
  const s = calc(self)
  const p = calc(partner)
  return computeSynastry(s.pos, p.pos, s.avail, p.avail)
}
