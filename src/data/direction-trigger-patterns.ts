import type { PlanetKey, AspectType } from '@/src/lib/astrology/constants'
import { HARD_ASPECT_TYPES } from '@/src/lib/astrology/constants'
import type { ExtendedTransitPlanetKey } from '@/src/lib/astrology/transit'
import type { TriggerPolarity } from '@/src/lib/astrology/trigger-polarity'

// ダイレクション（進行）で発動している出生アスペクトに、さらにトランシット天体が
// 重なることで意味が強まる「発動パターン」の定義。
// 「決定版 西洋占星術 実修」等を参考に、書籍の記述をオリジナルの言い回しで要約している。
export type DirectionTriggerPattern = {
  id: string
  directedPlanet: PlanetKey // ダイレクション（進行）させる天体
  natalPlanet: PlanetKey // 出生の天体（ダイレクションの相手）
  // ダイレクション側のアスペクト角度を限定する場合（例: ハードのみ）。省略時は任意
  directionAspectTypes?: AspectType[]
  triggerPlanet: ExtendedTransitPlanetKey // トランシット側の天体
  triggerNatalPoint: PlanetKey // トランシットが働きかける出生点
  // 良い運（lucky）か、注意すべき運（caution）か。UIの色分け・アイコンに使用
  polarity: TriggerPolarity
  title: string
  description: string
}

export const DIRECTION_TRIGGER_PATTERNS: DirectionTriggerPattern[] = [
  {
    id: 'direction-pluto-sun-mercury',
    directedPlanet: 'pluto',
    natalPlanet: 'sun',
    directionAspectTypes: HARD_ASPECT_TYPES,
    triggerPlanet: 'mercury',
    triggerNatalPoint: 'sun',
    polarity: 'caution',
    title: '出生 太陽×D冥王星 に T水星が関与',
    description:
      'ダイレクションの冥王星が出生の太陽とハードアスペクト（合・矩・衝）を形成している年に、トランシットの水星が重なる期間です。人生の大転換期にあたり、行動が性急になりがちなタイミング。リーダー的な立場にある人は闘争的なふるまいを避け、この時期の重要な交渉や早合点は控えめにしましょう。',
  },
  {
    id: 'direction-sun-pluto-sun',
    directedPlanet: 'sun',
    natalPlanet: 'pluto',
    directionAspectTypes: HARD_ASPECT_TYPES,
    triggerPlanet: 'sun',
    triggerNatalPoint: 'pluto',
    polarity: 'caution',
    title: '出生 冥王星×D太陽 に T太陽が関与',
    description:
      'ダイレクションの太陽が出生の冥王星とハードアスペクト（合・矩・衝）を形成している年に、トランシットの太陽が重なる期間です。それまで水面下にあったこと（浮気や仕事上の激変など）が突如として表面化しやすいタイミング。この時期の言動は慎重に。',
  },
  {
    id: 'direction-sun-pluto-jupiter',
    directedPlanet: 'sun',
    natalPlanet: 'pluto',
    triggerPlanet: 'jupiter',
    triggerNatalPoint: 'pluto',
    polarity: 'lucky',
    title: '出生 冥王星×D太陽 に T木星が関与',
    description:
      'ダイレクションの太陽が出生の冥王星とアスペクトを形成している年に、トランシットの木星が重なる期間です。年上の有力者との出会いや、遺産相続など大きな財産を得る好機とされています。ただし木星が通過したあとに大切なものを失う可能性も指摘されているので、浮かれすぎず大切に扱いましょう。',
  },
]
