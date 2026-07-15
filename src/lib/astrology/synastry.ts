import type { PlanetPositions } from './planets'
import { COMPAT_PAIRS, COMPAT_MASTER, type CompatComment } from '@/src/data/aspect-compat-master'

const PLANET_JP: Record<string, string> = {
  sun: '太陽', moon: '月', mercury: '水星', venus: '金星',
  mars: '火星', jupiter: '木星', saturn: '土星', asc: 'ASC', mc: 'MC',
}
const ANGLES = [0, 45, 60, 90, 120, 135, 180]
const ORB = 2

function angDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360
  if (d > 180) d = 360 - d
  return d
}

/**
 * 使える感受点を返す。
 * - 月・ASC・MC: 出生時刻＋都市（緯度経度）の両方が必要
 * - それ以外（太陽・水星・金星・火星・木星・土星）: 常に使える
 */
function availablePlanets(hasTime: boolean, hasCity: boolean): Set<string> {
  const base = new Set(['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'])
  if (hasTime && hasCity) {
    base.add('moon')
    base.add('asc')
    base.add('mc')
  }
  return base
}

export type SynAvail = { hasTime: boolean; hasCity: boolean }

export type SynAspect = {
  selfPlanet: string
  partnerPlanet: string
  selfJP: string
  partnerJP: string
  angle: number
  orb: number
  group: 'A' | 'B' | 'C'
  weight: number
  scores: { 恋愛: number; 夫婦家庭: number; 仕事: number; 友人: number }
  comment: CompatComment
}

export type SynCategory = '恋愛' | '夫婦家庭' | '仕事' | '友人'

export type SynResult = {
  /** 総合点（0-100）。該当アスペクト0個なら null */
  total: number | null
  categories: Record<SynCategory, number | null>
  /** 検出した全アスペクト（重み降順→角度） */
  aspects: SynAspect[]
}

/**
 * 自分と相手の天体位置からシナストリー（相性）を算出する。
 * 評価対象はエクセルの15ペア×7角度（オーブ2°以内）のみ。
 * self/partner の可用性（時刻・都市の有無）は人ごとに独立して適用する。
 */
export function computeSynastry(
  selfPos: PlanetPositions,
  partnerPos: PlanetPositions,
  self: SynAvail,
  partner: SynAvail
): SynResult {
  const selfAvail = availablePlanets(self.hasTime, self.hasCity)
  const partnerAvail = availablePlanets(partner.hasTime, partner.hasCity)
  const aspects: SynAspect[] = []

  const tryDetect = (
    selfKey: string,
    partnerKey: string,
    entryKey: string,
    dir: 'ab' | 'ba'
  ) => {
    if (!selfAvail.has(selfKey) || !partnerAvail.has(partnerKey)) return
    const selfLon = selfPos[selfKey as keyof PlanetPositions]
    const partnerLon = partnerPos[partnerKey as keyof PlanetPositions]
    if (selfLon == null || partnerLon == null) return
    const diff = angDiff(selfLon, partnerLon)
    for (const angle of ANGLES) {
      const orb = Math.abs(diff - angle)
      if (orb <= ORB) {
        const entry = COMPAT_MASTER[entryKey]?.[angle]
        if (!entry) return
        const comment = dir === 'ab' ? entry.ab : entry.ba
        if (!comment) return
        aspects.push({
          selfPlanet: selfKey,
          partnerPlanet: partnerKey,
          selfJP: PLANET_JP[selfKey] ?? selfKey,
          partnerJP: PLANET_JP[partnerKey] ?? partnerKey,
          angle,
          orb: Math.round(orb * 10) / 10,
          group: entry.group,
          weight: entry.weight,
          scores: entry.scores,
          comment,
        })
        return
      }
    }
  }

  for (const [ka, kb] of COMPAT_PAIRS) {
    const key = `${ka}|${kb}`
    // 自A×相B
    tryDetect(ka, kb, key, 'ab')
    // 自B×相A（同じ星どうしは重複させない）
    if (ka !== kb) tryDetect(kb, ka, key, 'ba')
  }

  // 集計: カテゴリごと round(Σ(点×重み)/Σ重み ×10)
  const cats: SynCategory[] = ['恋愛', '夫婦家庭', '仕事', '友人']
  const categories = {} as Record<SynCategory, number | null>
  const sumW = aspects.reduce((s, a) => s + a.weight, 0)
  for (const c of cats) {
    if (sumW === 0) {
      categories[c] = null
    } else {
      const num = aspects.reduce((s, a) => s + a.scores[c] * a.weight, 0)
      categories[c] = Math.round((num / sumW) * 10)
    }
  }
  const total =
    sumW === 0
      ? null
      : Math.round((cats.reduce((s, c) => s + (categories[c] as number), 0) / cats.length))

  // 並び: 重み降順 → 角度昇順
  aspects.sort((a, b) => b.weight - a.weight || a.angle - b.angle)

  return { total, categories, aspects }
}
