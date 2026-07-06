/**
 * 地支相性（支合・三合・冲・刑・害・破）の説明。
 * 人生タブの「相性」行で、日支（自分の座）× その年の年支の関係を表示するのに使う。
 * 情報元：地支相性表。
 */

import type { BranchRelation } from '@/src/lib/meishikiCalc'

export type AishoInfo = {
  /** 良い運かどうか（吉＝支合・三合、凶＝冲・刑・害・破） */
  good: boolean
  /** 一言ラベル */
  short: string
  /** 説明文 */
  desc: string
}

export const AISHO_TEXT: Record<BranchRelation, AishoInfo> = {
  支合: {
    good: true,
    short: '結びつく良縁の年',
    desc: '支合（しごう）は、引き合って結びつく「良縁」の関係。物事がまとまりやすく、人やチャンスとの縁が深まる良い年です。協力・パートナーシップ・結婚・契約など「結ぶ」ことに追い風が吹きます。信頼できる相手と手を組み、縁を大切にすると運が大きく開きます。',
  },
  三合: {
    good: true,
    short: '発展・成就の年',
    desc: '三合（さんごう）は、強く調和して力が集まる、最も勢いのある良い関係。物事が大きく発展し、目標が実を結びやすい年です。仲間や協力者に恵まれ、チームや周囲の後押しで成果が加速します。積極的に動くほどチャンスが広がる、攻めに向いた吉の運気です。',
  },
  冲: {
    good: false,
    short: '変化・衝突に注意の年',
    desc: '冲（ちゅう）は、真正面からぶつかり合う関係。変化・移動・別れ・トラブルが起きやすく、環境が大きく動く年です。転職・引っ越し・人間関係の転機など、良くも悪くも「動き」が出ます。無理な決断や感情的な衝突を避け、変化を落ち着いて受け止めることが大切です。',
  },
  刑: {
    good: false,
    short: '摩擦・こじれに注意の年',
    desc: '刑（けい）は、摩擦やこじれを生みやすい関係。対人トラブル・ストレス・ケガや体調不良に注意したい年です。感情的になったり、強引に進めたりすると問題がこじれやすい時期。冷静さと丁寧さを心がけ、無理をせず慎重に進めると波風を抑えられます。',
  },
  害: {
    good: false,
    short: 'すれ違いに注意の年',
    desc: '害（がい）は、じわじわと足を引っ張るような関係。人間関係のすれ違いや、小さな妨げ・邪魔が起きやすい年です。信頼していた相手との行き違いや、思わぬ横やりに気をつけたい時期。信頼できる人を大切にし、無理をせず身近な関係を丁寧に扱うと安心です。',
  },
  破: {
    good: false,
    short: 'ほころび・中断に注意の年',
    desc: '破（は）は、ほころびや中断を招きやすい関係。計画の狂い・約束の破れ・物事の停滞が起きやすい、軽めの注意の年です。予定が崩れたり、途中でつまずいたりしやすいので、念入りな確認と柔軟な対応が鍵。焦らず立て直す姿勢でいれば、大きな痛手にはなりにくい時期です。',
  },
}

/** 良い関係の集合 */
export const AISHO_GOOD_SET = new Set<BranchRelation>(['支合', '三合'])

/** 相性の総合判定（表示用のラベルとトーン） */
export function aishoVerdict(rels: BranchRelation[]): {
  label: string
  tone: 'good' | 'bad' | 'mixed' | 'none'
} {
  const hasGood = rels.some((r) => AISHO_GOOD_SET.has(r))
  const hasBad = rels.some((r) => !AISHO_GOOD_SET.has(r))
  if (hasGood && hasBad) return { label: '吉凶混在', tone: 'mixed' }
  if (hasGood) return { label: '良い運', tone: 'good' }
  if (hasBad) return { label: '注意', tone: 'bad' }
  return { label: '穏やか', tone: 'none' }
}
