/**
 * 60干支・10通変星のオリジナルキャラクター
 *
 * 画像は Figma（占いアプリ / Page 1）の生成画像を 512px の WebP に変換して
 * public/images/characters/ に置いている。
 * - 60干支: 十二支＝動物（体）× 十干＝衣装・持ち物
 * - 10通変星: 共通の「星の精霊」。体の色＝五行、職業の衣装＝星の性質
 */

export type Character = {
  /** キャラ名 */
  name: string
  /** 見た目のひとこと説明 */
  motif: string
  /** public 以下の画像パス */
  src: string
}

const pad = (n: number) => String(n).padStart(2, '0')

// ─── 60干支 ─────────────────────────────────────────────

// 十干ごとの衣装・持ち物（甲乙丙丁戊己庚辛壬癸）
const STEM_MOTIF = [
  '葉っぱのフードをかぶった',
  '花かんむりとツタをまとった',
  '太陽のポンチョを着た',
  'ちょうちんを灯した',
  '山の帽子をかぶった',
  '麦わら帽子で苗を育てる',
  '銀のかぶとをかぶった',
  '宝石のティアラをつけた',
  '波のマントをはおった',
  '雨がっぱで傘をさした',
] as const

// 十二支ごとの動物（子丑寅卯辰巳午未申酉戌亥）
const BRANCH_ANIMAL = [
  'ネズミ', '仔牛', '子トラ', 'ウサギ', 'ちび竜', 'ヘビ',
  '仔馬', 'ヒツジ', '子ザル', 'ヒヨコ', '子犬', 'うりぼう',
] as const

// 干支ID 1（甲子）〜 60（癸亥）の順
const KANSHI_NAMES = [
  'コノハ', 'ハナモ', 'ヒナタ', 'トモリ', 'ミネル', 'ミノリ', 'カブト', 'キララ', 'ナミオ', 'シズク',
  'ワカバ', 'ツタマル', 'テルル', 'ホノカ', 'イワオ', 'ムギ', 'ギンタ', 'ルリ', 'カイ', 'コサメ',
  'コズエ', 'スズナ', 'ヒマワ', 'アカリ', 'コイシ', 'ノハラ', 'ハヤテ', 'シンジュ', 'ミナモ', 'キリコ',
  'モエギ', 'ナズナ', 'ヒカル', 'ランタ', 'ゴロタ', 'ウリボ', 'チャキ', 'コハク', 'マリン', 'アマネ',
  'ミドリ', 'フジ', 'アサヒ', 'ホタル', 'ゴンタ', 'コムギ', 'マモル', 'ヒスイ', 'ウミネ', 'ツユ',
  'コダマ', 'サクラ', 'テラス', 'ユラ', 'タカネ', 'ワタ', 'ハガネ', 'キラリ', 'ナギサ', 'ミゾレ',
] as const

/** 干支ID（1〜60）からキャラを取得する。範囲外なら null */
export function getKanshiCharacter(id: number): Character | null {
  if (!Number.isInteger(id) || id < 1 || id > 60) return null
  const i = id - 1
  return {
    name: KANSHI_NAMES[i],
    motif: `${STEM_MOTIF[i % 10]}${BRANCH_ANIMAL[i % 12]}`,
    src: `/images/characters/kanshi/${pad(id)}.webp`,
  }
}

// ─── 10通変星 ───────────────────────────────────────────

// 通変星ID 1（比肩）〜 10（印綬）の順
const TSUHENSEI_CHARACTERS = [
  { name: 'トコトコ', motif: '自分の道を歩く、旅人の星の精霊' },
  { name: 'ガンバ', motif: '負けずぎらいな、挑戦者の星の精霊' },
  { name: 'パティ', motif: 'たのしいを分けあう、料理人の星の精霊' },
  { name: 'アトリ', motif: '感性ゆたかな、芸術家の星の精霊' },
  { name: 'アキナ', motif: 'ご縁をつなぐ、旅商人の星の精霊' },
  { name: 'コツコツ', motif: '大切なものを守る、蔵番の星の精霊' },
  { name: 'ユウキ', motif: 'まっさきに動く、勇者の星の精霊' },
  { name: 'キチン', motif: 'まじめで頼れる、委員長の星の精霊' },
  { name: 'フシギ', motif: 'ひらめきいっぱいの、魔法使いの星の精霊' },
  { name: 'ハカセ', motif: '知恵をたくわえる、学者の星の精霊' },
] as const

/** 通変星ID（1〜10）からキャラを取得する。範囲外なら null */
export function getTsuhenseiCharacter(id: number): Character | null {
  if (!Number.isInteger(id) || id < 1 || id > 10) return null
  const c = TSUHENSEI_CHARACTERS[id - 1]
  return { ...c, src: `/images/characters/tsuhensei/${pad(id)}.webp` }
}
