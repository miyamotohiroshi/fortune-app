import { PLANET_NAMES_JA, ASPECT_NAMES_JA } from './constants'
import type { PlanetKey, AspectType } from './constants'
import type { DirectionAspectResult } from './directions'
import { DIRECTION_MASTER_MAP } from '@/src/data/direction-master'
import { computeYearFortune, branchRelations, STEMS, BRANCHES, TSUHENSEI, JUNI_UN } from '@/src/lib/meishikiCalc'
import type { BranchRelation } from '@/src/lib/meishikiCalc'
import { AISHO_TEXT } from '@/src/data/aisho-master'

// 人生タブの一番下に置く「人生の概要をAIで読むためのプロンプト」を組み立てる。
// 量を抑えるため、ダイレクションは解説文を入れず「組み合わせ＋カテゴリ・重要度・タイトル」だけ、
// 四柱推命の年運も「年運星・十二運・相性・天徳・天中殺」の記号だけを1年1行で入れる。
// 名前は含めない。

/** 載せるダイレクションの重要度の下限 */
export const LIFE_PROMPT_MIN_IMPORTANCE = 7

export type LifePromptMode = 'past' | 'future'

export type LifePromptInput = {
  mode: LifePromptMode
  aspects: DirectionAspectResult[]
  birthYmd: string // yyyy-mm-dd
  birthTime: string | null
  birthCity: string | null
  hasTime: boolean
  startYear: number // 人生年表の表示範囲（0歳の年）
  endYear: number // 人生年表の表示範囲（100歳の年）
  currentYear: number
  shichu: {
    dayStem: number
    dayBranch: number
    monthBranch: number
    genmei: number | null
  } | null
}

// 出生時刻・出生地がない場合に除外する点
const TIME_DEPENDENT: PlanetKey[] = ['moon', 'asc', 'mc', 'desc']

type Period = {
  directedPlanet: PlanetKey
  natalPlanet: PlanetKey
  aspectType: AspectType
  masterKey: string
  startYear: number
  endYear: number
  minOrb: number
}

/** 同じ組み合わせ（進行天体×出生天体×アスペクト）の連続する年を1つの期間にまとめる */
function toPeriods(aspects: DirectionAspectResult[]): Period[] {
  const byKey = new Map<string, DirectionAspectResult[]>()
  for (const a of aspects) {
    const k = `${a.directedPlanet}-${a.natalPlanet}-${a.aspectType}`
    byKey.set(k, [...(byKey.get(k) ?? []), a])
  }
  const periods: Period[] = []
  for (const list of byKey.values()) {
    list.sort((a, b) => a.year - b.year)
    let cur: Period | null = null
    for (const a of list) {
      if (cur && a.year === cur.endYear + 1) {
        cur.endYear = a.year
        cur.minOrb = Math.min(cur.minOrb, a.orb)
      } else {
        if (cur) periods.push(cur)
        cur = {
          directedPlanet: a.directedPlanet,
          natalPlanet: a.natalPlanet,
          aspectType: a.aspectType,
          masterKey: a.masterKey,
          startYear: a.year,
          endYear: a.year,
          minOrb: a.orb,
        }
      }
    }
    if (cur) periods.push(cur)
  }
  return periods.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear)
}

function ageRange(fromAge: number, toAge: number): string {
  return fromAge === toAge ? `${fromAge}歳` : `${fromAge}〜${toAge}歳`
}

function yearRange(from: number, to: number): string {
  return from === to ? `${from}` : `${from}〜${to}`
}

export function buildLifePrompt(input: LifePromptInput): string {
  const { mode, birthYmd, birthTime, birthCity, hasTime, startYear, endYear, currentYear, shichu } = input
  const birthYear = startYear
  const currentAge = currentYear - birthYear
  const isPast = mode === 'past'
  // 過去＝0歳〜昨年、これから＝今年〜100歳
  const fromYear = isPast ? startYear : Math.max(startYear, currentYear)
  const toYear = isPast ? Math.min(endYear, currentYear - 1) : endYear
  const fromAge = fromYear - birthYear
  const toAge = toYear - birthYear
  const usable = (...keys: PlanetKey[]) => hasTime || keys.every(k => !TIME_DEPENDENT.includes(k))

  // 対象期間・重要度で絞り込み（期間は範囲の端で切る）
  const periods = toPeriods(
    input.aspects.filter(a =>
      a.year >= fromYear && a.year <= toYear &&
      usable(a.directedPlanet, a.natalPlanet) &&
      (DIRECTION_MASTER_MAP.get(a.masterKey)?.importance ?? 0) >= LIFE_PROMPT_MIN_IMPORTANCE
    ),
  )

  const lines: string[] = []
  const push = (...l: string[]) => lines.push(...l)

  const title = isPast ? 'これまでの人生（振り返り）' : 'これからの人生（見通し）'
  push(
    `あなたは西洋占星術（ダイレクション）と四柱推命の両方に精通した経験豊富な鑑定師です。以下のデータだけを根拠に、私の${title}を読み解いてください。`,
    '',
    '## 重要な前提',
    '- このチャットより前の会話履歴、あなたが保存しているメモリ、私（ユーザー）について把握している情報や過去のデータは一切参照・加味しないでください。',
    '- 下に示したデータに書かれていないこと（実際に起きた出来事の決めつけ、推測による私の属性など）は持ち込まないでください。',
    '- データにない事柄を断定しないでください。',
    '',
    '## 基本情報',
    `- 生年月日：${birthYmd.replace(/-/g, '/')}`,
    `- 出生時刻：${birthTime ?? '不明'}`,
    `- 出生地：${birthCity ?? '不明'}`,
    `- 現在：${currentYear}年（${currentAge}歳になる年）`,
    `- 鑑定対象：${ageRange(fromAge, toAge)}（${yearRange(fromYear, toYear)}年）`,
    '- 年齢は「その年に迎える満年齢」です（西暦の年 − 生まれ年）。',
  )
  if (!hasTime) {
    push('- 出生時刻・出生地が不明なため、月・ASC・MCが関わる配置はすべて除外しています。これらには触れないでください。')
  }
  push('')

  // ── ダイレクション ──
  push(
    `## ダイレクション（ソーラーアーク）一覧（重要度${LIFE_PROMPT_MIN_IMPORTANCE}以上・${periods.length}件）`,
    '人生の大きな流れを示す配置です。同じ配置が続く年はまとめています。年齢順に並べています。',
    '形式：年齢（西暦）／ダイレクション天体 → 出生の天体 アスペクト／カテゴリ（チャンス・転機・試練・変容）／重要度(1〜10)／テーマ',
  )
  if (periods.length === 0) push('- （該当なし）')
  for (const pd of periods) {
    const m = DIRECTION_MASTER_MAP.get(pd.masterKey)
    push(
      `- ${ageRange(pd.startYear - birthYear, pd.endYear - birthYear)}（${yearRange(pd.startYear, pd.endYear)}）／` +
        `D${PLANET_NAMES_JA[pd.directedPlanet]} → 出生${PLANET_NAMES_JA[pd.natalPlanet]} ${ASPECT_NAMES_JA[pd.aspectType]}／` +
        `${m?.category ?? '-'}／重要度 ${m?.importance ?? '-'}／${m?.title ?? ''}`,
    )
  }
  push('')

  // ── 配置が集中する年齢（複合判断の手がかり） ──
  const counts = new Map<number, { total: number; importanceSum: number; cats: Record<string, number> }>()
  for (const pd of periods) {
    const m = DIRECTION_MASTER_MAP.get(pd.masterKey)
    const cat = m?.category ?? '-'
    for (let y = pd.startYear; y <= pd.endYear; y++) {
      const c = counts.get(y) ?? { total: 0, importanceSum: 0, cats: {} }
      c.total++
      c.importanceSum += m?.importance ?? 0
      c.cats[cat] = (c.cats[cat] ?? 0) + 1
      counts.set(y, c)
    }
  }
  // ほぼ毎年何かしら重なるため、件数（同数なら重要度の合計）の多い上位の年だけを挙げる
  const DENSE_TOP = 10
  const denseYears = [...counts.entries()]
    .filter(([, c]) => c.total >= 2)
    .sort((a, b) => b[1].total - a[1].total || b[1].importanceSum - a[1].importanceSum)
    .slice(0, DENSE_TOP)
    .sort((a, b) => a[0] - b[0])
  push(
    '## 配置が特に集中する年齢',
    `同じ年に重なる配置が特に多い年齢（上位${DENSE_TOP}）です。複数の配置を組み合わせて判断する際の手がかりにしてください。`,
  )
  if (denseYears.length === 0) push('- （該当なし）')
  for (const [y, c] of denseYears) {
    const cats = Object.entries(c.cats).map(([k, n]) => `${k}${n}`).join('・')
    push(`- ${y - birthYear}歳（${y}）：${c.total}件（${cats}）`)
  }
  push('')

  // ── 四柱推命の年運 ──
  if (shichu) {
    const { dayStem, dayBranch, monthBranch, genmei } = shichu
    push(
      '## 四柱推命の年運（1年1行）',
      `あなたの日柱は${STEMS[dayStem]}${BRANCHES[dayBranch]}${genmei ? `、元命（中心星）は${TSUHENSEI[genmei]}` : ''}です。四柱推命の一年は立春（2月4日頃）から始まります。`,
      '形式：年齢（西暦・干支）：年運星（通変星）／十二運／日支との相性（支合・三合は吉、冲・刑・害・破は注意、天剋地冲は特に強い凶意）／天徳（災いを和らげる吉神）／天中殺（運気の変わり目で守りの時期）',
    )
    const usedRels = new Set<BranchRelation>()
    for (let y = fromYear; y <= toYear; y++) {
      const f = computeYearFortune(dayStem, dayBranch, y, monthBranch)
      const rels = branchRelations(dayBranch, f.branch)
      rels.forEach(r => usedRels.add(r))
      const parts = [`${TSUHENSEI[f.tsuhen]}`, JUNI_UN[f.juniUn]]
      if (f.isTenkokuChichu) parts.push('天剋地冲')
      else if (rels.length) parts.push(`相性:${rels.join('・')}`)
      if (f.tentoku.hasKijin) parts.push('天徳貴人')
      else if (f.tentoku.hasGou) parts.push('天徳合')
      if (f.isKubou) parts.push('天中殺')
      push(`- ${y - birthYear}歳（${y}・${STEMS[f.stem]}${BRANCHES[f.branch]}）：${parts.join('／')}`)
    }
    if (usedRels.size) {
      push('相性の意味：' + [...usedRels].map(r => `${r}＝${AISHO_TEXT[r].short}`).join('、'))
    }
    push('')
  }

  // ── 出力指示 ──
  const decadeFrom = Math.floor(fromAge / 10) * 10
  push(
    '# 出力してほしい内容',
    `以下の構成で、日本語で4000〜5000字程度にまとめてください。対象は${ageRange(fromAge, toAge)}です。`,
    `1. ${isPast ? 'これまでの人生の概要：どんな流れをたどってきた人生か' : 'これからの人生の概要：どんな流れが待っている人生か'}`,
    `2. 年代別の流れ：${decadeFrom}代から10年ごとに区切り、各年代の主なテーマと山場を書いてください。山場は「○歳ごろ」ではなく「34〜35歳」のように具体的な年齢で示してください。`,
    `3. ${isPast ? 'これまでの' : 'これからの'}大きな転換期トップ10：具体的な年齢（範囲）、カテゴリ、根拠となった複数の配置、どんな転換かを箇条書きで。年齢順に並べてください。`,
    isPast
      ? '4. 今の自分につながっていること：過去の転換期が現在（' + currentAge + '歳）にどう活きているか'
      : '4. 直近10年の注目時期：' + currentAge + '〜' + (currentAge + 10) + '歳のうち特に重要な時期と過ごし方',
    '5. 人生を通じたアドバイス',
    '',
    '## 読み解き方のルール',
    '- 1つの配置だけで判断せず、同じ時期に重なる複数のダイレクションを組み合わせて総合的に判断してください（例：チャンスと試練が重なる時期は「試練を経て得る飛躍」のように読む）。',
    '- 四柱推命の年運（年運星・十二運・相性・天徳・天中殺）とも照らし合わせ、西洋と東洋が同じ方向を示す時期は強く、食い違う時期は慎重に読んでください。',
    '- 重要度の高い配置、「配置が特に集中する年齢」を優先して取り上げてください。',
    '- 1年ごとの羅列は避け、流れとしてまとめてください。ただし転換期や山場は必ず具体的な年齢で示してください。',
    isPast
      ? '- 実際に何が起きたかは分からないため、「〜が起きやすかった時期」「〜がテーマだった時期」のように表現してください。'
      : '- 未来を断定せず、「〜が起きやすい時期」「〜を意識するとよい時期」のように表現してください。',
    '- 占術に詳しくない人にも分かる言葉で書き、専門用語には簡単な説明を添えてください。',
  )

  return lines.join('\n')
}
