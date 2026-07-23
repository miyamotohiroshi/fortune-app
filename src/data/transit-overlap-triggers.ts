import type { PlanetKey, AspectType } from '@/src/lib/astrology/constants'
import { HARD_ASPECT_TYPES } from '@/src/lib/astrology/constants'
import type { ExtendedTransitPlanetKey } from '@/src/lib/astrology/transit'
import type { TriggerPolarity } from '@/src/lib/astrology/trigger-polarity'

// 出生の1天体に対するトランシット天体（ベース）のアスペクトに、さらに別の
// トランシット天体が重なることで意味が強まる（あるいは変化する）「発動パターン」の定義。
// 「決定版 西洋占星術 実修」等を参考に、書籍の記述をオリジナルの言い回しで要約している。
export type TransitOverlapTriggerPattern = {
  id: string
  natalPoint: PlanetKey
  baseTransitPlanet: ExtendedTransitPlanetKey
  // ベース側のアスペクト角度を限定する場合（例: ハードのみ）。省略時は任意
  baseAspectTypes?: AspectType[]
  overlapTransitPlanet: ExtendedTransitPlanetKey
  // 重なる側のアスペクト角度を限定する場合。省略時は任意
  overlapAspectTypes?: AspectType[]
  // このトランシット天体が同時に絡んでいる間は発動しない（除外条件）
  excludePlanets: ExtendedTransitPlanetKey[]
  // natalPointが出生図上でこの候補天体のいずれかとアスペクトを持っていないと発動しない（省略時は制限なし）
  requiresNatalAspectWith?: PlanetKey[]
  // 良い運（lucky）か、注意すべき運（caution）か。UIの色分け・アイコンに使用
  polarity: TriggerPolarity
  title: string
  description: string
}

export const TRANSIT_OVERLAP_TRIGGER_PATTERNS: TransitOverlapTriggerPattern[] = [
  {
    id: 'overlap-sun-uranus-mars',
    natalPoint: 'sun',
    baseTransitPlanet: 'uranus',
    baseAspectTypes: HARD_ASPECT_TYPES,
    overlapTransitPlanet: 'mars',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 太陽×T天王星 に T火星が関与',
    description:
      '出生の太陽にトランシットの天王星がハードアスペクト（合・矩・衝）を形成し、これまでの生き方への不満や変化を求める気持ちが高まっている時期に、さらにトランシットの火星が重なる期間です。転職・独立・新しい恋愛など変化を求める気持ちが極度の興奮となって表れやすく、事故やトラブルを起こしやすいタイミング。この時期は勢いに任せず、慎重な行動を心がけましょう。',
  },
  {
    id: 'overlap-sun-pluto-saturn',
    natalPoint: 'sun',
    baseTransitPlanet: 'pluto',
    overlapTransitPlanet: 'saturn',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 太陽×T冥王星 に T土星が関与',
    description:
      '出生の太陽にトランシットの冥王星がアスペクトを形成し、家庭・健康・仕事・愛情など人生の根底から生き方の変動を迫られている時期に、さらにトランシットの土星が重なる期間です。仕事上の権力闘争や大切な人との離別、これまで築いてきたものを体面のために守ろうとしても結果的に手放すことになりやすいタイミング。状況が深刻化すれば離婚に至ることもありますが、根本から意識を変えて出直せば、新たな道が開けるとされています。',
  },
  {
    id: 'overlap-sun-pluto-mars',
    natalPoint: 'sun',
    baseTransitPlanet: 'pluto',
    overlapTransitPlanet: 'mars',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 太陽×T冥王星 に T火星が関与',
    description:
      '出生の太陽にトランシットの冥王星がアスペクトを形成し、人生の根底から生き方の変動を迫られている時期に、さらにトランシットの火星が重なる期間です。過労によって体調を崩し、ダウンしやすいタイミングとされています。無理を重ねず、休息を優先しましょう。',
  },
  {
    id: 'overlap-uranus-pluto-mars',
    natalPoint: 'uranus',
    baseTransitPlanet: 'pluto',
    overlapTransitPlanet: 'mars',
    excludePlanets: [],
    requiresNatalAspectWith: ['asc', 'mc', 'sun', 'moon'],
    polarity: 'caution',
    title: '出生 天王星×T冥王星 に T火星が関与',
    description:
      '出生の天王星がASC・MC・太陽・月のいずれかとアスペクトを持つ人が、トランシットの冥王星から働きかけを受けている（人生の次のステージに向けた準備期間・自己管理が必要な時期）中に、さらにトランシットの火星が重なる期間です。突発的な事故に気をつけてください。',
  },
]
