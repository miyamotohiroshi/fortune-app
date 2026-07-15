'use server'

import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { computeSynastry, type SynResult } from '@/src/lib/astrology/synastry'

export type BirthInput = {
  birthday: string // ISO or YYYY-MM-DD
  birthTime: string | null // "HH:MM"
  birthCity: string | null
}

/** 自分と相手の生年月日から相性（シナストリー）を算出する */
export async function runSynastry(self: BirthInput, partner: BirthInput): Promise<SynResult> {
  const calc = (b: BirthInput) => {
    const cityCoords = b.birthCity ? (CITY_COORDS[b.birthCity] ?? null) : null
    const hasTime = !!b.birthTime
    const hasCity = !!cityCoords
    const pos = calculatePlanetPositions(new Date(b.birthday), b.birthTime, cityCoords)
    return { pos, avail: { hasTime, hasCity } }
  }
  const s = calc(self)
  const p = calc(partner)
  return computeSynastry(s.pos, p.pos, s.avail, p.avail)
}
