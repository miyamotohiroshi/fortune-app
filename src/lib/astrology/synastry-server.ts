import { calculatePlanetPositions } from './planets'
import { CITY_COORDS } from './cities'
import { computeSynastry, type SynResult } from './synastry'
import { computeMeishiki } from '@/src/lib/meishikiCalc'

// サーバー専用: ephemeris（astronomy-engine）を含むためクライアントから import しないこと。

export type BirthInput = {
  birthday: string // ISO or YYYY-MM-DD
  birthTime: string | null // "HH:MM"
  birthCity: string | null
}

/** 2人の生年月日から相性（シナストリー）を算出する */
export function synastryFromBirth(self: BirthInput, partner: BirthInput): SynResult {
  const calc = (b: BirthInput) => {
    const birthDate = new Date(b.birthday)
    const cityCoords = b.birthCity ? (CITY_COORDS[b.birthCity] ?? null) : null
    const pos = calculatePlanetPositions(birthDate, b.birthTime, cityCoords)
    // 四柱推命の日干支（干合・支合ボーナス用）。日柱は出生時刻に依存しないため計算可能
    const meishiki = computeMeishiki(birthDate.getFullYear(), birthDate.getMonth() + 1, birthDate.getDate(), null)
    const dayPillar = meishiki.pillars[2]
    return {
      pos,
      avail: { hasTime: !!b.birthTime, hasCity: !!cityCoords },
      day: dayPillar.stem !== null && dayPillar.branch !== null
        ? { stem: dayPillar.stem, branch: dayPillar.branch }
        : undefined,
    }
  }
  const s = calc(self)
  const p = calc(partner)
  return computeSynastry(s.pos, p.pos, s.avail, p.avail, s.day, p.day)
}
