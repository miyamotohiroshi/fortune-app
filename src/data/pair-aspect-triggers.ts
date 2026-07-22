import type { PlanetKey, AspectType } from '@/src/lib/astrology/constants'
import { HARD_ASPECT_TYPES } from '@/src/lib/astrology/constants'
import type { ExtendedTransitPlanetKey } from '@/src/lib/astrology/transit'
import type { TriggerPolarity } from '@/src/lib/astrology/trigger-polarity'

// 出生の2天体アスペクトに、進行中のトランシット天体が関与することで
// 意味が強まる（あるいは打ち消される）「発動パターン」の定義。
// 「決定版 西洋占星術 実修」等を参考に、書籍の記述をオリジナルの言い回しで要約している。
export type PairTriggerPattern = {
  id: string
  planets: [PlanetKey, PlanetKey]
  // 出生アスペクトの角度を限定する場合（例: 合のみ、ハードのみ）。省略時は任意のアスペクトで成立
  natalAspectTypes?: AspectType[]
  triggerPlanet: ExtendedTransitPlanetKey
  // トランシット側のアスペクト角度を限定する場合。省略時は任意
  triggerAspectTypes?: AspectType[]
  // このトランシット天体が同時に絡んでいる間は発動しない（除外条件）
  excludePlanets: ExtendedTransitPlanetKey[]
  // 良い運（lucky）か、注意すべき運（caution）か。UIの色分け・アイコンに使用
  polarity: TriggerPolarity
  title: string
  description: string
}

export const PAIR_TRIGGER_PATTERNS: PairTriggerPattern[] = [
  {
    id: 'venus-pluto-jupiter',
    planets: ['venus', 'pluto'],
    triggerPlanet: 'jupiter',
    excludePlanets: ['mars', 'saturn'],
    polarity: 'lucky',
    title: '出生 金星×冥王星 に T木星が関与',
    description:
      '出生の金星×冥王星のアスペクトに、進行中の木星が働きかけている期間です。火星・土星がからんでいなければ、仕事や恋愛で大きなチャンスが巡ってきやすいタイミング。独立や新しい挑戦、ここぞという勝負に出ても好結果につながりやすいでしょう。ただしギャンブル運の後押しにはなりません。',
  },
  {
    id: 'asc-pluto-saturn',
    planets: ['asc', 'pluto'],
    natalAspectTypes: HARD_ASPECT_TYPES,
    triggerPlanet: 'saturn',
    triggerAspectTypes: HARD_ASPECT_TYPES,
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 ASC×冥王星 に T土星が関与',
    description:
      '出生のASC×冥王星のハードアスペクト（合・矩・衝）に、トランシットの土星がハードアスペクトを重ねる期間です。過去の良くない行いのツケが2年以内に表面化しやすいタイミング。体力が落ちて体調を崩しやすく、精神的にも重圧を感じやすい時期なので、何ごとも控えめに、誠実な行動を心がけましょう。',
  },
  {
    id: 'mc-saturn-jupiter',
    planets: ['mc', 'saturn'],
    natalAspectTypes: ['conjunction'],
    triggerPlanet: 'jupiter',
    excludePlanets: [],
    polarity: 'lucky',
    title: '出生 MC×土星 に T木星が関与',
    description:
      '出生のMC×土星が合（0度）の人に、トランシットの木星が働きかける期間です。結婚や婚約に発展しやすい好機とされています。仕事面でも、これまでの努力が実を結びやすいタイミングです。',
  },
  {
    id: 'moon-asc-saturn',
    planets: ['moon', 'asc'],
    natalAspectTypes: HARD_ASPECT_TYPES,
    triggerPlanet: 'saturn',
    triggerAspectTypes: HARD_ASPECT_TYPES,
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 月×ASC に T土星が関与',
    description:
      '出生の月×ASCのハードアスペクトに、トランシットの土星がハードアスペクトを重ねる期間です。義務感や責任に縛られながら、身近な人との別れを経験しやすいタイミングとされています。',
  },
  {
    id: 'moon-mc-saturn',
    planets: ['moon', 'mc'],
    natalAspectTypes: HARD_ASPECT_TYPES,
    triggerPlanet: 'saturn',
    triggerAspectTypes: HARD_ASPECT_TYPES,
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 月×MC に T土星が関与',
    description:
      '出生の月×MCのハードアスペクトに、トランシットの土星がハードアスペクトを重ねる期間です。義務感や責任に縛られながら、身近な人との別れを経験しやすいタイミングとされています。',
  },
  {
    id: 'moon-venus-neptune',
    planets: ['moon', 'venus'],
    triggerPlanet: 'neptune',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 月×金星 に T海王星が関与',
    description:
      '出生の月×金星のアスペクトに、トランシットの海王星が働きかける期間です。深い失恋や悲恋を経験しやすく、精神的なダメージや未練を長く引きずりがちなタイミングとされています。',
  },
  {
    id: 'sun-mars-uranus',
    planets: ['sun', 'mars'],
    triggerPlanet: 'uranus',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 太陽×火星 に T天王星が関与',
    description:
      '出生の太陽×火星のアスペクトに、トランシットの天王星が働きかける期間です。特に過去に事故やトラブルの経験がある人は、社会的な立場を失ったり、肉体的・精神的なダメージを受けやすいタイミング。慎重な行動を心がけましょう。',
  },
  {
    id: 'saturn-asc-pluto',
    planets: ['saturn', 'asc'],
    triggerPlanet: 'pluto',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 土星×ASC に T冥王星が関与',
    description:
      '出生の土星がASCとアスペクトを持つ人に、トランシットの冥王星が働きかける期間です。家族を守る責任など、大きな苦悩を背負いやすいタイミング。ここで試練から逃げると、数年以内により重い形で返ってくるとされるので、正面から向き合うのが賢明です。',
  },
  {
    id: 'saturn-mc-pluto',
    planets: ['saturn', 'mc'],
    triggerPlanet: 'pluto',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 土星×MC に T冥王星が関与',
    description:
      '出生の土星がMCとアスペクトを持つ人に、トランシットの冥王星が働きかける期間です。仕事上の重責や後継者としての立場など、大きな苦悩を背負いやすいタイミング。ここで試練から逃げると、数年以内により重い形で返ってくるとされるので、正面から向き合うのが賢明です。',
  },
  {
    id: 'saturn-sun-pluto',
    planets: ['saturn', 'sun'],
    triggerPlanet: 'pluto',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 土星×太陽 に T冥王星が関与',
    description:
      '出生の土星が太陽とアスペクトを持つ人に、トランシットの冥王星が働きかける期間です。大きな責任や重圧を背負いやすいタイミング。ここで試練から逃げると、数年以内により重い形で返ってくるとされるので、正面から向き合うのが賢明です。',
  },
  {
    id: 'saturn-moon-pluto',
    planets: ['saturn', 'moon'],
    triggerPlanet: 'pluto',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 土星×月 に T冥王星が関与',
    description:
      '出生の土星が月とアスペクトを持つ人に、トランシットの冥王星が働きかける期間です。家族を守る責任など、大きな苦悩を背負いやすいタイミング。ここで試練から逃げると、数年以内により重い形で返ってくるとされるので、正面から向き合うのが賢明です。',
  },
  {
    id: 'uranus-venus-sun',
    planets: ['uranus', 'venus'],
    triggerPlanet: 'sun',
    excludePlanets: [],
    polarity: 'lucky',
    title: '出生 天王星×金星 に T太陽が関与',
    description:
      '出生の天王星×金星のアスペクトに、トランシットの太陽が働きかける期間です。クリエイティブな分野で才能が開花し、物事が前向きに進展しやすいタイミングとされています。',
  },
  {
    id: 'uranus-sun-transitsun',
    planets: ['uranus', 'sun'],
    triggerPlanet: 'sun',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 天王星×太陽 に T太陽が関与',
    description:
      '出生の天王星×太陽のアスペクトに、トランシットの太陽が働きかける期間です。自分に不利益をもたらす人物や、得体の知れない怪しい人物と親しくなりやすいタイミングとされています。新しい出会いには慎重さが必要です。',
  },
  {
    id: 'uranus-moon-sun',
    planets: ['uranus', 'moon'],
    triggerPlanet: 'sun',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 天王星×月 に T太陽が関与',
    description:
      '出生の天王星×月のアスペクトに、トランシットの太陽が働きかける期間です。自分に不利益をもたらす人物や、得体の知れない怪しい人物と親しくなりやすいタイミングとされています。新しい出会いには慎重さが必要です。',
  },
  {
    id: 'neptune-moon-sun',
    planets: ['neptune', 'moon'],
    triggerPlanet: 'sun',
    excludePlanets: [],
    polarity: 'caution',
    title: '出生 海王星×月 に T太陽が関与',
    description:
      '出生の海王星×月のアスペクトに、トランシットの太陽が働きかける期間です。現実逃避の傾向が強まりやすく、アルコールなど依存的な行動が刺激されやすいタイミングとされています。',
  },
]
