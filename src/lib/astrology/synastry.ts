import type { PlanetPositions } from './planets'
import { COMPAT_PAIRS, COMPAT_MASTER, type CompatComment, type CompatScores } from '@/src/data/aspect-compat-master'
import { stemCompatTier, branchRelations, type StemCompatTier } from '@/src/lib/meishikiCalc'

const PLANET_JP: Record<string, string> = {
  sun: '太陽', moon: '月', mercury: '水星', venus: '金星', mars: '火星',
  jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星',
  asc: 'ASC', mc: 'MC',
}
const ANGLES = [0, 45, 60, 90, 120, 135, 180]
const ORB = 2
/** 加重平均がこの値(1-10)で100点。それ以上は100（＝良い相性が90点台〜100に乗るキャリブレーション） */
const CALIB_MAX = 8.5

export type SynCategory = '恋愛' | '夫婦家庭' | '仕事' | '友人'
const CATS: SynCategory[] = ['恋愛', '夫婦家庭', '仕事', '友人']
/** 総合点を出すときのカテゴリ比重（恋愛・結婚を重めに） */
const CATEGORY_WEIGHT: Record<SynCategory, number> = { 恋愛: 3, 夫婦家庭: 2, 仕事: 1, 友人: 1 }

/**
 * 四柱推命：日干支のボーナス。カテゴリ集計の重み付き平均に、仮想アスペクトとして合算する
 * （西洋アスペクトが少ないカテゴリほど効果が大きく出て、多いカテゴリでは控えめになじむ）。
 *
 * 恋愛＝日干同士の相性を4段階（十干相性表・相性相関図に基づく）で判定:
 *   最高(干合)=9点／よい(相生)=8点／普通(比和)=6点／合わない(相剋)=3点、重みは共通4
 */
const FOUR_PILLARS_BONUS_WEIGHT = 5
const STEM_TIER_SCORE: Record<StemCompatTier, number> = { best: 9.5, good: 8, normal: 6, bad: 3 }
/** 支合（日支同士）が効くカテゴリ＝夫婦家庭（結婚）・友人・仕事。恋愛は日干の4段階評価を使うため対象外 */
const SHIGOU_CATEGORIES: SynCategory[] = ['夫婦家庭', '友人', '仕事']

export type SynDayPillar = { stem: number; branch: number }

function angDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360
  if (d > 180) d = 360 - d
  return d
}

/** アスペクトの角度→グループと重み（A:0/90/180=5, B:60/120=3, C:45/135=1） */
function groupWeight(angle: number): { group: 'A' | 'B' | 'C'; weight: number } {
  if (angle === 0 || angle === 90 || angle === 180) return { group: 'A', weight: 5 }
  if (angle === 60 || angle === 120) return { group: 'B', weight: 3 }
  return { group: 'C', weight: 1 }
}

/**
 * 使える感受点。
 * - 月・ASC・MC: 出生時刻＋都市の両方が必要
 * - 太陽・水星・金星・火星・木星・土星・天王星・海王星・冥王星: 常に使える（外惑星は動きが遅く時刻不要）
 */
function availablePlanets(hasTime: boolean, hasCity: boolean): Set<string> {
  const base = new Set(['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])
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
  scores: CompatScores
  comment: CompatComment
}

export type SynResult = {
  /** 総合点（0-100）。該当アスペクト0個なら null */
  total: number | null
  categories: Record<SynCategory, number | null>
  aspects: SynAspect[]
  /** 四柱推命：日干支の相性（UIでの説明表示に使う）。日干支データがない場合はnull */
  fourPillars: {
    /** 日干同士の相性4段階（恋愛に反映） */
    stemTier: StemCompatTier | null
    /** 日支同士が支合か（夫婦家庭・友人・仕事に反映） */
    shigou: boolean
  }
}

/**
 * 自分と相手の天体位置からシナストリー（相性）を算出する。
 * 評価対象は本＋補完の60ペア×7角度（オーブ2°以内）。点数・文章はペア共通、
 * アスペクトの強さは角度→重みで反映。「なし(null)」カテゴリは集計から除外。
 */
export function computeSynastry(
  selfPos: PlanetPositions,
  partnerPos: PlanetPositions,
  self: SynAvail,
  partner: SynAvail,
  selfDay?: SynDayPillar,
  partnerDay?: SynDayPillar
): SynResult {
  const selfAvail = availablePlanets(self.hasTime, self.hasCity)
  const partnerAvail = availablePlanets(partner.hasTime, partner.hasCity)
  const aspects: SynAspect[] = []

  const detect = (selfKey: string, partnerKey: string, key: string, dir: 'ab' | 'ba') => {
    if (!selfAvail.has(selfKey) || !partnerAvail.has(partnerKey)) return
    const e = COMPAT_MASTER[key]
    if (!e) return
    const comment = dir === 'ab' ? e.ab : e.ba
    if (!comment) return
    const sl = selfPos[selfKey as keyof PlanetPositions]
    const pl = partnerPos[partnerKey as keyof PlanetPositions]
    if (sl == null || pl == null) return
    const diff = angDiff(sl, pl)
    for (const angle of ANGLES) {
      const orb = Math.abs(diff - angle)
      if (orb <= ORB) {
        const { group, weight } = groupWeight(angle)
        aspects.push({
          selfPlanet: selfKey,
          partnerPlanet: partnerKey,
          selfJP: PLANET_JP[selfKey] ?? selfKey,
          partnerJP: PLANET_JP[partnerKey] ?? partnerKey,
          angle,
          orb: Math.round(orb * 10) / 10,
          group,
          weight,
          scores: e.scores,
          comment,
        })
        return
      }
    }
  }

  for (const [ka, kb] of COMPAT_PAIRS) {
    const key = `${ka}|${kb}`
    detect(ka, kb, key, 'ab')
    if (ka !== kb) detect(kb, ka, key, 'ba')
  }

  // 四柱推命：日干支の相性（西洋アスペクトと同じ加重平均に、仮想アスペクトとして合算）
  // 恋愛＝日干同士の4段階評価、夫婦家庭・友人・仕事＝支合（日支同士）の有無
  const stemTier: StemCompatTier | null = selfDay && partnerDay ? stemCompatTier(selfDay.stem, partnerDay.stem) : null
  const shigou = !!selfDay && !!partnerDay && branchRelations(selfDay.branch, partnerDay.branch).includes('支合')

  // カテゴリごと: 加重平均(1-10) → キャリブレーション(0-100)。null カテゴリは除外。
  const categories = {} as Record<SynCategory, number | null>
  for (const c of CATS) {
    let num = 0
    let den = 0
    for (const a of aspects) {
      const s = a.scores[c]
      if (s != null) {
        num += s * a.weight
        den += a.weight
      }
    }
    if (c === '恋愛' && stemTier !== null) {
      num += STEM_TIER_SCORE[stemTier] * FOUR_PILLARS_BONUS_WEIGHT
      den += FOUR_PILLARS_BONUS_WEIGHT
    }
    if (shigou && SHIGOU_CATEGORIES.includes(c)) {
      num += STEM_TIER_SCORE.best * FOUR_PILLARS_BONUS_WEIGHT
      den += FOUR_PILLARS_BONUS_WEIGHT
    }
    categories[c] = den === 0 ? null : Math.round(Math.min(100, (num / den / CALIB_MAX) * 100))
  }
  // 総合＝カテゴリ比重（恋愛・結婚を重め）での加重平均。null カテゴリは除外。
  let tnum = 0
  let tden = 0
  for (const c of CATS) {
    const v = categories[c]
    if (v != null) {
      tnum += v * CATEGORY_WEIGHT[c]
      tden += CATEGORY_WEIGHT[c]
    }
  }
  const total = tden === 0 ? null : Math.round(tnum / tden)

  aspects.sort((a, b) => b.weight - a.weight || a.angle - b.angle)
  return { total, categories, aspects, fourPillars: { stemTier, shigou } }
}
