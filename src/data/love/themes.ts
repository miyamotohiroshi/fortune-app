/**
 * 恋愛診断（四柱推命・日柱 60干支 × 10テーマ）の型とテーマ定義。
 * 設計・解釈ルール: docs/恋愛診断_設計案.md
 *
 * 解釈ルール（本アプリ既存の四柱推命実装に準拠）:
 *   日干（十干・陰陽・五行）…… 恋愛の芯。陽干＝自分から動く・外に表す／陰干＝内に秘める・受けて育てる
 *   日支（配偶者の座）………… 親密な関係の中での振る舞い・パートナーに求める空気感
 *   日支の通変星（本気）……… 関係の型（比劫＝対等・仲間／食傷＝楽しさ・表現／財＝守る・尽くす／官＝けじめ・責任／印＝受け入れる・学び合う）
 *   日干の十二運（日支上）…… 恋愛でのエネルギーの出方と波
 * 性別で役割を決める古典的な読み方（財星＝妻・官星＝夫など）は採用しない。
 * 日柱のみの鑑定なので「日柱に基づく基本的な恋愛傾向」として表示し、四柱全体の総合鑑定とは区別する。
 */

export type LoveTheme = 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06' | 'L07' | 'L08' | 'L09' | 'L10'

export type LoveGroupId = 'basic' | 'attraction' | 'expression' | 'lasting'

/** テーマの定義（表示名・UIのグループ）。配列の順がグループ内の表示順 */
export const LOVE_THEMES: { id: LoveTheme; name: string; group: LoveGroupId }[] = [
  { id: 'L01', name: '基本的な恋愛傾向', group: 'basic' },
  { id: 'L06', name: '恋愛における弱点', group: 'basic' },
  { id: 'L02', name: '好きになる相手', group: 'attraction' },
  { id: 'L03', name: '好きになったとき', group: 'attraction' },
  { id: 'L05', name: '愛情表現', group: 'expression' },
  { id: 'L07', name: '相手との距離感', group: 'expression' },
  { id: 'L04', name: '恋愛関係の築き方', group: 'expression' },
  { id: 'L08', name: '長期的な恋愛', group: 'lasting' },
  { id: 'L09', name: '別れ・失恋への向き合い方', group: 'lasting' },
  { id: 'L10', name: '恋愛をより良くするヒント', group: 'lasting' },
]

/** UIのグループ（アコーディオンの見出し）。配列の順が表示順 */
export const LOVE_GROUPS: { id: LoveGroupId; label: string }[] = [
  { id: 'basic', label: '恋愛の基本的な性格' },
  { id: 'attraction', label: '惹かれる相手・恋の始まり' },
  { id: 'expression', label: '愛情表現・距離感' },
  { id: 'lasting', label: '関係を続けるためのヒント' },
]

/** 1テーマ分の鑑定文（データファイルでの書き方） */
export type LoveReadingDraft = {
  /** カードの見出し（干支ごとに違う短い一文） */
  title: string
  /** 本文（段落は \n 区切り）。目安150〜250字 */
  body: string
  /** 解釈根拠（例: '日干:甲(陽木)', '日支通変星:印綬', '十二運:沐浴'） */
  basis: string[]
}

/** 1干支分のデータ（データファイルでの書き方） */
export type LovePillarEntry = {
  /** 既存の干支ID 1〜60（甲子=1 … 癸亥=60） */
  dayPillarId: number
  /** 恋愛タイプ名（トップ表示） */
  typeName: string
  /** 1行の要約（トップ表示） */
  summary: string
  /** 鑑定文の版。文章を書き直したら上げる */
  version: number
  readings: Partial<Record<LoveTheme, LoveReadingDraft>>
}

/** 取得用に整形した鑑定文 */
export type LoveReading = {
  id: string // 'love-01-L01'
  dayPillarId: number
  dayPillar: string // '甲子'
  theme: LoveTheme
  themeName: string
  title: string
  body: string
  interpretationBasis: string[]
  version: number
}

export type LoveProfile = {
  dayPillarId: number
  dayPillar: string
  typeName: string
  summary: string
}
